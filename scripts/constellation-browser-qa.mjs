import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = new URL(process.env.CONSTELLATION_QA_ORIGIN || "http://localhost:3042");
const connection = new URL(process.env.DATABASE_URL || "invalid:");
if (!["localhost", "127.0.0.1"].includes(origin.hostname) || !["localhost", "127.0.0.1"].includes(connection.hostname) || connection.pathname !== "/constellation_test") throw new Error("Only localhost and isolated constellation_test are allowed");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: connection.href }) });
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const contexts = [], users = [];
const password = randomUUID() + "aA1!", nonce = randomUUID().slice(0, 8);
const name = `Recette Constellation ${nonce}`;
const output = process.env.CONSTELLATION_QA_OUTPUT || join(tmpdir(), `constellation-browser-${nonce}`);
await mkdir(output, { recursive: true });
let venture;
async function until(check) {
  for (let i = 0; i < 100; i++) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 200)); }
  throw new Error("Database assertion did not become true");
}
async function login(user) {
  const context = await browser.newContext({ viewport: { width: 1365, height: 950 } }); contexts.push(context);
  const page = await context.newPage(); page.setDefaultTimeout(60000); page.setDefaultNavigationTimeout(120000);
  await page.goto(new URL("/login", origin).href);
  await page.locator('[name="email"]').fill(user.email); await page.locator('[name="password"]').fill(password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click(); await page.waitForURL("**/dashboard");
  return page;
}
const record = () => db.communityVenture.findUniqueOrThrow({ where: { id: venture.id } });
async function review(page, title, approve) {
  await page.goto(new URL("/admin/constellation", origin).href);
  const row = page.locator("article").filter({ has: page.getByRole("link", { name: title, exact: true }) });
  if (approve) {
    await row.locator('input[type="checkbox"]').check();
    await row.getByRole("button", { name: "Publier la fiche", exact: true }).click();
  } else {
    await row.locator('textarea[name="note"]').fill("Merci de préciser la description de ces modifications.");
    await row.getByRole("button", { name: "Demander des ajustements" }).click();
  }
}

try {
  const passwordHash = await bcrypt.hash(password, 10);
  for (const [index, role] of ["USER", "USER", "ADMIN"].entries()) users.push(await db.user.create({ data: { username: `qa_cv_${nonce}_${index}`, email: `qa_cv_${nonce}_${index}@example.test`, passwordHash, role, emailVerified: new Date() } }));
  const owner = await login(users[0]);
  await owner.goto(new URL("/constellation/new", origin).href);
  for (const [field, value] of Object.entries({ name, summary: "Une réalisation locale destinée à vérifier les parcours utilisateurs.", description: `Un service d’éducation pour les coopératives et les familles. Cette fiche de recette vérifie la publication et les besoins de développement web. Identifiant ${nonce}.`, websiteUrl: `https://qa-${nonce}.example.org`, needs: "a,b,c,d,e,f,g" })) await owner.locator(`form [name="${field}"]`).fill(value);
  await owner.locator('[name="country"]').selectOption("CI"); await owner.locator('[name="sector"]').selectOption("SERVICES"); await owner.locator('[name="confirmed"]').check();
  await owner.getByRole("button", { name: "Envoyer en validation" }).click();
  await owner.getByRole("alert").filter({ hasText: "6 mots-clés" }).waitFor();
  assert.equal(await owner.locator('[name="name"]').inputValue(), name);
  await owner.locator('[name="needs"]').fill("design; développement web\nC");
  await owner.getByRole("button", { name: "Envoyer en validation" }).click(); await owner.getByRole("status").filter({ hasText: "Ta fiche" }).waitFor();
  venture = await db.communityVenture.findFirstOrThrow({ where: { ownerId: users[0].id } });
  assert.deepEqual(venture.needs, ["design", "développement web", "c"]);
  const admin = await login(users[2]); await review(admin, name, true); await until(async () => (await record()).status === "PUBLISHED");
  const anonymous = await browser.newContext({ viewport: { width: 390, height: 844 } }); contexts.push(anonymous);
  const publicPage = await anonymous.newPage(); publicPage.setDefaultTimeout(60000);
  await publicPage.goto(new URL(`/constellation?q=${nonce}%20DEV`, origin).href);
  await publicPage.locator(`[data-venture-link="${venture.slug}"]`).waitFor();
  assert.equal(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await publicPage.locator(`[data-venture-link="${venture.slug}"]`).click();
  const dialog = publicPage.getByRole("dialog"); await dialog.waitFor();
  assert.notEqual(await dialog.evaluate(element => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)");
  await publicPage.screenshot({ path: join(output, "constellation-mobile-overlay.png"), fullPage: true });
  await dialog.getByRole("button", { name: "Fermer", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await publicPage.goto(new URL(`/search?q=${nonce}%20education`, origin).href);
  await publicPage.locator(`a[href="/constellation/${venture.slug}"]`).waitFor();
  await owner.goto(new URL(`/constellation/new?edit=${venture.id}`, origin).href);
  const stale = await owner.context().newPage(); stale.setDefaultTimeout(60000); await stale.goto(owner.url());
  const secret = `Modification privée ${nonce}`;
  await owner.locator('[name="name"]').fill(secret); await owner.locator('[name="confirmed"]').check();
  await owner.getByRole("button", { name: "Envoyer en validation" }).click(); await until(async () => (await record()).revision === 3);
  assert.equal((await record()).name, name);
  await publicPage.goto(new URL(`/constellation/${venture.slug}`, origin).href);
  assert.equal((await publicPage.content()).includes(secret), false);
  await stale.locator('[name="summary"]').fill("Brouillon concurrent conservé après le refus serveur."); await stale.locator('[name="confirmed"]').check();
  await stale.getByRole("button", { name: "Envoyer en validation" }).click(); await stale.getByRole("alert").filter({ hasText: "modifiée" }).waitFor();
  assert.equal(await stale.locator('[name="summary"]').inputValue(), "Brouillon concurrent conservé après le refus serveur.");
  await review(admin, secret, false); await until(async () => (await record()).pendingChanges === null);
  assert.equal((await record()).status, "PUBLISHED"); assert.equal((await record()).name, name);
  await owner.goto(new URL(`/constellation/new?edit=${venture.id}`, origin).href);
  const approvedName = `Version approuvée ${nonce}`;
  await owner.locator('[name="name"]').fill(approvedName); await owner.locator('[name="confirmed"]').check();
  await owner.getByRole("button", { name: "Envoyer en validation" }).click(); await until(async () => (await record()).pendingChanges !== null);
  await review(admin, approvedName, true); await until(async () => (await record()).name === approvedName);
  const applicant = await login(users[1]); await applicant.goto(new URL(`/constellation/${venture.slug}`, origin).href);
  const message = "Je propose une collaboration concrète autour des tests et de la documentation de votre réalisation.";
  await applicant.locator('[name="message"]').fill(message); await applicant.getByRole("button", { name: "Proposer une collaboration", exact: true }).click();
  await until(async () => await db.ventureCollaboration.count({ where: { ventureId: venture.id } }) === 1);
  const request = await db.ventureCollaboration.findFirstOrThrow({ where: { ventureId: venture.id } });
  await applicant.goto(new URL("/dashboard/constellation", origin).href); await applicant.getByRole("button", { name: "Annuler la proposition" }).click();
  await until(async () => (await db.ventureCollaboration.findUniqueOrThrow({ where: { id: request.id } })).status === "CANCELLED");
  // Advance only an isolated fixture, not a production cooldown.
  await db.ventureCollaboration.update({ where: { id: request.id }, data: { updatedAt: new Date(Date.now() - 120000) } });
  await applicant.goto(new URL(`/constellation/${venture.slug}`, origin).href);
  await applicant.locator('[name="message"]').fill(message + " Voici une nouvelle proposition."); await applicant.getByRole("button", { name: "Envoyer une nouvelle proposition" }).click();
  await until(async () => (await db.ventureCollaboration.findUniqueOrThrow({ where: { id: request.id } })).status === "PENDING");
  assert.equal(await db.ventureCollaboration.count({ where: { ventureId: venture.id } }), 1);
  await applicant.goto(new URL("/dashboard/constellation", origin).href);
  await applicant.getByText("Propositions précédentes", { exact: true }).click();
  await applicant.screenshot({ path: join(output, "collaboration-history-desktop.png"), fullPage: true });
  console.log(JSON.stringify({ ok: true, checks: ["French keyword limit and preserved inputs", "semicolon/newline parsing and C keyword", "initial moderation", "partial accent-insensitive search", "global search", "mobile modal open/close and opaque background", "public version retained", "pending edits private", "stale edit rejected with draft retained", "reject then approve published changes", "renew cancelled collaboration with history"], screenshots: output }));
} catch (error) {
  for (const [index, context] of contexts.entries()) { const page = context.pages()[0]; if (page) { console.error(`QA page ${index}: ${page.url()}`); await page.screenshot({ path: join(output, `failure-${index}.png`), fullPage: true }).catch(() => {}); } }
  throw error;
} finally {
  for (const context of contexts) await context.close(); await browser.close();
  if (venture) { const requests = await db.ventureCollaboration.findMany({ where: { ventureId: venture.id }, select: { id: true } }); await db.auditLog.deleteMany({ where: { entityId: { in: [venture.id, ...requests.map(request => request.id)] } } }); await db.communityVenture.deleteMany({ where: { id: venture.id } }); }
  await db.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } }); await db.$disconnect();
}
