import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = new URL(process.env.SIGNUP_QA_ORIGIN || "http://127.0.0.1:3042");
const database = new URL(process.env.DATABASE_URL || "invalid:");
if (!["127.0.0.1", "localhost"].includes(origin.hostname) || !["127.0.0.1", "localhost"].includes(database.hostname) || database.pathname !== "/constellation_test") throw new Error("Signup QA requires localhost and isolated constellation_test");
if (process.env.RESEND_API_KEY) throw new Error("Signup QA must not send real emails");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: database.href }) });
const browser = await chromium.launch({ headless: true, ...(process.env.QA_BROWSER === "chromium" ? {} : { channel: "chrome" }) });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage(); page.setDefaultTimeout(90000);
const nonce = randomUUID().slice(0,8), username = "signup_"+nonce, email = username+"@example.test", password = randomUUID()+"Aa1!";
const takenEmail = "taken_"+nonce+"@example.test", takenUsername = "taken_"+nonce;
const output = process.env.SIGNUP_QA_OUTPUT || join(tmpdir(), "afro-signup-"+nonce);
await mkdir(output, { recursive: true });
const results = [];
const pass = message => { results.push(message); console.log("PASS "+message); };
const url = path => new URL(path, origin).href;
try {
  await db.user.create({ data: { email: takenEmail, username: takenUsername } });
  await page.goto(url("/register")); await page.waitForURL("**/construction");
  // Dedicated CI sequence; no production puzzle value is embedded here.
  for (const name of ["Sun", "Baobab", "Laptop"]) {
    await page.locator(`[class*="hotspot${name}"]`).click();
    await page.waitForTimeout(300);
  }
  await page.locator('button[aria-label="Pixel mystérieux"]').first().click();
  await page.waitForURL("**/register"); pass("real puzzle unlocks the signup form");
  const create = page.getByRole("button", { name: "Créer mon compte", exact: true });
  await create.waitFor();
  await page.locator('[name=name]').fill("Recette inscription");
  await page.locator('[name=username]').fill(takenUsername.toUpperCase());
  await page.locator('[name=email]').fill(email);
  await page.locator('[name=password]').fill(password);
  // Missing proof must still be refused by the real server, even if DOM is altered.
  await page.locator('[name="cf-turnstile-response"]').evaluate(el => { el.value = ""; });
  await create.click();
  await page.getByRole("alert").filter({ hasText: "Validation anti-robot échouée" }).waitFor();
  assert.equal(await db.user.count({ where: { email } }), 0); pass("missing captcha rejected before account creation");
  await create.waitFor(); await create.click();
  await page.getByRole("alert").filter({ hasText: "déjà pris" }).waitFor();
  assert.equal(await page.locator('[name=email]').inputValue(), email);
  assert.equal(await page.locator('[name=password]').inputValue(), password);
  assert.equal(await page.locator('[name=username]').inputValue(), takenUsername);
  pass("duplicate username retains fields and renews both anti-bot proofs");
  await page.screenshot({ path: join(output,"signup-error-mobile.png"), fullPage: true });
  await page.locator('[name=username]').fill(username);
  await create.waitFor(); await create.click(); await page.waitForURL("**/dashboard");
  let user = await db.user.findUniqueOrThrow({ where: { email } });
  assert.equal(user.emailVerified, null);
  assert.equal((await (await context.request.get(url("/api/auth/session"))).json()).user.id, user.id);
  pass("real registration creates one account and opens its authenticated session");
  // Read only the fixture's token: validates link consumption, not inbox delivery.
  const token = await db.verificationToken.findFirstOrThrow({ where: { identifier: "verify:"+email } });
  await page.goto(url("/verify-email?token="+token.token));
  await page.getByText("Ton adresse email est confirmée", { exact: false }).waitFor();
  user = await db.user.findUniqueOrThrow({ where: { email } }); assert.ok(user.emailVerified);
  assert.equal(await db.verificationToken.count({ where: { identifier: "verify:"+email } }), 0);
  pass("verification link confirms the email and is consumed");
  const second = await browser.newContext();
  try {
    const login = await second.newPage(); await login.goto(url("/login"));
    await login.locator('[name=email]').fill(email); await login.locator('[name=password]').fill(password);
    await login.getByRole("button", { name: "Se connecter", exact: true }).click(); await login.waitForURL("**/dashboard");
    assert.equal((await (await second.request.get(url("/api/auth/session"))).json()).user.id, user.id);
    pass("new browser can sign in with the newly registered account");
  } finally { await second.close(); }
} finally {
  await context.close(); await browser.close();
  await db.verificationToken.deleteMany({ where: { identifier: { in: ["verify:"+email,"verify:"+takenEmail] } } });
  await db.authRateLimit.deleteMany({ where: { key: { in: [email,takenEmail].map(s=>createHash("sha256").update(s).digest("hex")) } } });
  await db.user.deleteMany({ where: { email: { in: [email,takenEmail] } } });
  await db.$disconnect();
  await writeFile(join(output,"results.json"), JSON.stringify({ passed: results, limitations: ["Cloudflare official dummy keys, isolated database; no real inbox delivery", "Chromium automation, not a physical Safari/Android test"] },null,2));
}
