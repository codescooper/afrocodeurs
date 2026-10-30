import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = new URL(process.env.SECURITY_QA_ORIGIN || "http://127.0.0.1:3042");
const connection = new URL(process.env.DATABASE_URL || "invalid:");
if (!["localhost", "127.0.0.1"].includes(origin.hostname) || !["localhost", "127.0.0.1"].includes(connection.hostname) || connection.pathname !== "/constellation_test") throw new Error("Only localhost and isolated constellation_test are allowed");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: connection.href }) });
const browser = await chromium.launch({ headless: true, ...(process.env.QA_BROWSER === "chromium" ? {} : { channel: "chrome" }) });
const contexts = [], users = [];
const password = randomUUID() + "aA1!", nextPassword = randomUUID() + "aA1!", finalPassword = randomUUID() + "aA1!";
const output = process.env.SECURITY_QA_OUTPUT || join(tmpdir(), "afro-security-" + randomUUID());
await mkdir(output, { recursive: true });
const url = path => new URL(path, origin).href;
const session = async context => (await context.request.get(url("/api/auth/session"))).json();
let forwardedAttempt = 0;
async function context() { const value = await browser.newContext(); contexts.push(value); return value; }
async function apiLogin(ctx, email, value) {
  const csrf = await (await ctx.request.get(url("/api/auth/csrf"))).json();
  await ctx.request.post(url("/api/auth/callback/credentials"), { form: { email, password: value, csrfToken: csrf.csrfToken, callbackUrl: url("/dashboard") }, headers: { "X-Auth-Return-Redirect": "1", "x-forwarded-for": `198.51.100.${++forwardedAttempt}` } });
  return session(ctx);
}
try {
  for (let i=0; i<2; i++) {
    const nonce = randomUUID().slice(0,8);
    users.push(await db.user.create({ data: { email: `security_${nonce}@example.test`, username: `security_${nonce}`, emailVerified: new Date(), passwordHash: await bcrypt.hash(password, 12) } }));
  }
  const [member, brute] = users;
  const first = await context(), second = await context();
  const page = await first.newPage(); page.setDefaultTimeout(45000);
  await page.goto(url("/login"));
  await page.locator('[name="email"]').fill(member.email); await page.locator('[name="password"]').fill(password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click(); await page.waitForURL("**/dashboard");
  assert.equal((await apiLogin(second, member.email, password)).user.id, member.id);
  assert.equal((await session(first)).user.id, member.id);
  console.log("PASS two independent authenticated browser sessions");

  const token = randomBytes(32).toString("hex");
  await db.verificationToken.create({ data: { token, identifier: `reset:${member.email}`, expires: new Date(Date.now()+60000) } });
  const resetContext = await context(); const reset = await resetContext.newPage(); reset.setDefaultTimeout(45000);
  await reset.goto(url(`/reset-password?token=${token}`)); await reset.locator('[name="password"]').fill(nextPassword);
  await reset.getByRole("button", { name: "Réinitialiser le mot de passe", exact: true }).click();
  await reset.getByText("Mot de passe réinitialisé.", { exact: false }).waitFor();
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: member.id } })).sessionVersion, 1);
  assert.equal((await session(first)).user, undefined); assert.equal((await session(second)).user, undefined);
  console.log("PASS password reset invalidates both real session cookies");
  assert.equal((await apiLogin(first, member.email, password)).user, undefined);
  assert.equal((await apiLogin(first, member.email, nextPassword)).user.id, member.id);
  assert.equal((await apiLogin(second, member.email, nextPassword)).user.id, member.id);

  await reset.goto(url(`/reset-password?token=${token}`)); await reset.locator('[name="password"]').fill(finalPassword);
  await reset.getByRole("button", { name: "Réinitialiser le mot de passe", exact: true }).click();
  await reset.getByText("Lien invalide ou expiré.", { exact: false }).waitFor();
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: member.id } })).sessionVersion, 1);
  console.log("PASS consumed reset token cannot change the password again");

  const obsolete = randomBytes(32).toString("hex");
  await db.verificationToken.create({ data: { token: obsolete, identifier: `reset:${member.email}`, expires: new Date(Date.now()+60000) } });
  await page.goto(url("/dashboard/settings"));
  await page.locator('[name="currentPassword"]').fill(nextPassword); await page.locator('[name="newPassword"]').fill(finalPassword);
  await page.getByRole("button", { name: "Changer le mot de passe", exact: true }).click();
  await page.waitForURL("**/login?passwordChanged=1");
  await page.getByRole("status").filter({ hasText: "Mot de passe mis à jour" }).waitFor();
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: member.id } })).sessionVersion, 2);
  assert.equal((await session(second)).user, undefined);
  assert.equal(await db.verificationToken.count({ where: { token: obsolete } }), 0);
  await page.screenshot({ path: join(output, "password-change-confirmation.png"), fullPage: true });
  console.log("PASS settings change signs out this browser, revokes other cookies and old reset links");

  assert.equal((await apiLogin(second, member.email, finalPassword)).user.id, member.id);
  const rejected = await second.request.post(url("/api/push/subscribe"), { data: { endpoint: "https://127.0.0.1:8443/internal", keys: { p256dh: "x", auth: "x" } } });
  assert.equal(rejected.status(), 400);
  assert.equal(await db.pushSubscription.count({ where: { userId: member.id } }), 0);
  console.log("PASS unsafe push endpoint rejected over HTTP without persistence");

  const attacker = await context();
  for (let i=0; i<12; i++) assert.equal((await apiLogin(await context(), brute.email, "wrong-password123")).user, undefined);
  const key = createHash("sha256").update(brute.email.toLowerCase()).digest("hex");
  assert.equal((await db.authRateLimit.findUniqueOrThrow({ where: { key } })).count, 10);
  assert.equal((await apiLogin(attacker, brute.email, password)).user, undefined);
  // Only advance the dedicated test account's quota in the isolated database.
  await db.authRateLimit.update({ where: { key }, data: { expiresAt: new Date(Date.now()-1000) } });
  assert.equal((await apiLogin(attacker, brute.email, password)).user.id, brute.id);
  console.log("PASS direct Auth.js callback quota survives cookies/IP changes and resets after expiry");
} finally {
  await Promise.all(contexts.map(value => value.close())); await browser.close();
  const emails = users.map(user => user.email);
  await db.verificationToken.deleteMany({ where: { identifier: { in: emails.map(email => `reset:${email}`) } } });
  await db.authRateLimit.deleteMany({ where: { key: { in: emails.map(email => createHash("sha256").update(email.toLowerCase()).digest("hex")) } } });
  await db.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
  await db.$disconnect();
}
