import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const origin = new URL(process.env.CONSTELLATION_QA_ORIGIN || "http://127.0.0.1:3042");
const connection = new URL(process.env.DATABASE_URL || "invalid:");
if (!["localhost","127.0.0.1"].includes(origin.hostname) || !["localhost","127.0.0.1"].includes(connection.hostname) || connection.pathname !== "/constellation_test") throw new Error("Local isolated QA only");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: connection.href }) });
const browser = await chromium.launch({ headless: true, ...(process.env.QA_BROWSER === "chromium" ? {} : { channel: "chrome" }) });
const output = join(process.env.CONSTELLATION_QA_OUTPUT || "./qa-output", "community-entry");
await mkdir(output, { recursive: true });
const contexts = [], checks = []; let user;
const pass = text => { checks.push(text); console.log("PASS "+text); };
const context = async options => { const ctx = await browser.newContext(options); contexts.push(ctx); return ctx; };
const url = path => new URL(path, origin).href;
try {
  const guest = await context({ viewport: { width: 390, height: 844 } }); const page = await guest.newPage(); page.setDefaultTimeout(30000);
  const html = await (await guest.request.get(url("/"))).text();
  assert.ok(html.includes("community-home-title") && html.includes("application/ld+json"));
  await page.goto(url("/")); await page.getByRole("dialog").waitFor();
  assert.equal(await page.getByText(/SITE EN CONSTRUCTION/i).count(), 0);
  const canvas = page.getByRole("dialog").locator("canvas");
  await page.waitForFunction(() => { const c = document.querySelector('[role="dialog"] canvas'); return c && new Set(c.getContext("2d").getImageData(0,0,320,180).data).size > 20; });
  assert.ok(await canvas.evaluate(el => new Set(el.getContext("2d").getImageData(0,0,320,180).data).size > 20));
  const before = await canvas.evaluate(el => el.toDataURL()); await page.waitForTimeout(150);
  assert.notEqual(await canvas.evaluate(el => el.toDataURL()), before);
  for (const width of [320,390,768,1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.getByRole("dialog").evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: join(output,`entry-${width}-scene.png`) });
    const overflow = await page.getByRole("dialog").evaluate(el => ({ width: el.clientWidth, scroll: el.scrollWidth,
      nodes: [...el.querySelectorAll("*")].filter(n=>n.getBoundingClientRect().right>el.getBoundingClientRect().right+1).slice(0,12).map(n=>({tag:n.tagName,cls:n.className,text:n.textContent.slice(0,90),right:n.getBoundingClientRect().right})) }));
    if (overflow.scroll > overflow.width) console.error("ENTRY_OVERFLOW", JSON.stringify(overflow));
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) console.error("PAGE_OVERFLOW",JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll("body *")].filter(n=>n.getBoundingClientRect().right>innerWidth+1).slice(0,16).map(n=>({tag:n.tagName,cls:n.className,text:n.textContent.slice(0,70),right:n.getBoundingClientRect().right})))));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.getByRole("dialog").evaluate(el => el.scrollWidth > el.clientWidth), false);
    await page.getByRole("button", { name: "Simple visiteur", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(output,`entry-${width}-choices.png`) });
  }
  pass("public SSR content preserved; first-visit entrance, animated canvas and four screen sizes render");
  await page.route("**/api/entry/visitor", route => route.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.getByRole("button", { name: "Simple visiteur", exact: true }).click(); await page.getByRole("alert").waitFor();
  assert.equal(await page.getByRole("dialog").count(), 1); await page.unroute("**/api/entry/visitor");
  await page.getByRole("button", { name: "Simple visiteur", exact: true }).click(); await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.ok((await guest.cookies()).some(c => c.name === "afrocodeurs-visitor" && c.value === "1"));
  assert.ok(!(await guest.cookies()).some(c => c.name === "afrocodeurs-preview"));
  await page.reload(); assert.equal(await page.getByRole("dialog").count(), 0);
  pass("visitor network failure retry, preference persistence and no puzzle bypass");
  await page.goto(url("/register")); await page.waitForURL("**/construction");
  // CI-only sequence, configured on the ephemeral server, never a production secret.
  await page.locator('[class*="hotspotSun"]').click();
  await page.getByText("Un fragment s’allume…", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Besoin d’un indice ?" }).click();
  for (const symbol of ["Baobab","Laptop"]) await page.locator(`[class*="hotspot${symbol}"]`).click();
  await page.locator('button[aria-label="Pixel mystérieux"]').first().click();
  await page.waitForURL("**/register"); await page.locator('[name="username"]').waitFor();
  pass("progress survives asking for an hint; solving the real puzzle opens registration");
  const direct = await context(); const links = await direct.newPage();
  for (const path of ["/projects","/knowledge","/communities"]) { const response = await links.goto(url(path)); assert.equal(response.status(),200); assert.equal(await links.getByRole("dialog").count(),0); }
  await links.goto(url("/")); await links.getByRole("dialog").waitFor(); await links.keyboard.press("Escape");
  await links.getByRole("dialog").waitFor({ state: "hidden" });
  pass("public direct links remain free and Escape chooses visitor access");
  const returning = await context({ viewport: { width:390,height:844 } }); const navigation = await returning.newPage();
  await navigation.goto(url("/"));
  await navigation.getByRole("dialog").getByRole("link", { name:"Découvrir AfroCodeurs",exact:true }).click();
  await navigation.waitForURL("**/a-propos");
  await navigation.getByRole("link", { name:"Rejoindre",exact:true }).click();
  await navigation.waitForURL("**/construction");
  await navigation.getByRole("button", { name:"Simple visiteur",exact:true }).click();
  await navigation.waitForURL(url("/")); await navigation.waitForTimeout(500);
  assert.equal(await navigation.getByRole("dialog").count(),0);
  pass("standalone visitor choice refreshes a previously cached welcome page");
  const nonce = randomUUID().slice(0,8), password = randomUUID()+"Aa1!";
  user = await db.user.create({ data: { email: `entry_${nonce}@example.test`, username: "entry_"+nonce, passwordHash: await bcrypt.hash(password,12), emailVerified: new Date() } });
  const member = await context(); const csrf = await (await member.request.get(url("/api/auth/csrf"))).json();
  await member.request.post(url("/api/auth/callback/credentials"), { form: { email: user.email,password,csrfToken:csrf.csrfToken,callbackUrl:url("/") }, headers: { "X-Auth-Return-Redirect":"1" } });
  assert.equal((await (await member.request.get(url("/api/auth/session"))).json()).user.id,user.id);
  const memberPage = await member.newPage(); await memberPage.goto(url("/")); assert.equal(await memberPage.getByRole("dialog").count(),0);
  await memberPage.goto(url("/construction")); await memberPage.waitForURL(url("/"));
  pass("authenticated members bypass the entrance and explicit puzzle page");
  const reduced = await context({ reducedMotion: "reduce" }); const still = await reduced.newPage(); await still.goto(url("/construction"));
  await still.waitForFunction(() => { const c = document.querySelector("canvas"); return c && c.getContext("2d").getImageData(0,0,1,1).data[3] > 0; });
  const frame = await still.locator("canvas").evaluate(el=>el.toDataURL()); await still.waitForTimeout(150);
  assert.equal(await still.locator("canvas").evaluate(el=>el.toDataURL()),frame);
  assert.equal(await still.locator("audio").evaluate(el=>el.autoplay), false);
  pass("reduced-motion canvas is static and audio never autoplays");
} finally {
  await Promise.all(contexts.map(c=>c.close())); await browser.close();
  if (user) { await db.authRateLimit.deleteMany({ where: { key: createHash("sha256").update(user.email).digest("hex") } }); await db.user.deleteMany({ where: { id:user.id } }); }
  await db.$disconnect(); await writeFile(join(output,"results.json"),JSON.stringify({ checks },null,2));
}
