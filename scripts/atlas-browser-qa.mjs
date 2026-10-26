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
const origin = new URL(process.env.ATLAS_QA_ORIGIN || "http://localhost:3041");
const database = new URL(process.env.DATABASE_URL || "invalid:");
if (!["localhost", "127.0.0.1"].includes(origin.hostname) || !["localhost", "127.0.0.1"].includes(database.hostname) || database.pathname !== "/constellation_test") throw new Error("Only localhost and isolated constellation_test are allowed");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: database.href }) });
const users = [];
const contexts = [];
let solution;
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const nonce = randomUUID().slice(0, 8);
const password = randomUUID() + "aA1!";
const output = process.env.ATLAS_QA_OUTPUT || join(tmpdir(), `atlas-browser-${nonce}`);
await mkdir(output, { recursive: true });

async function login(user) {
  const context = await browser.newContext({ viewport: { width: 1365, height: 950 } });
  contexts.push(context);
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  await page.goto(new URL("/login", origin).href);
  await page.locator('[name="email"]').fill(user.email);
  await page.locator('[name="password"]').fill(password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await page.waitForURL("**/dashboard");
  return page;
}

async function membershipCount(count) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await db.solutionMaintainer.count({ where: { solutionId: solution.id } }) === count) return;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.equal(await db.solutionMaintainer.count({ where: { solutionId: solution.id } }), count);
}

try {
  const passwordHash = await bcrypt.hash(password, 10);
  for (const [index, role] of ["USER", "USER", "ADMIN"].entries()) {
    users.push(await db.user.create({ data: { username: `qa_atlas_${nonce}_${index}`, email: `qa_atlas_${nonce}_${index}@example.test`, passwordHash, role, emailVerified: new Date() } }));
  }
  solution = await db.solution.create({ data: { name: `Atlas QA ${nonce}`, slug: `atlas-qa-${nonce}`, type: "SOFTWARE", description: "Solution de recette locale pour la communauté, sans contact avec de vrais membres.", createdById: users[2].id, repositoryUrl: "https://github.com/example/atlas-test", license: "MIT", sector: "EDUCATION", countriesServed: ["Bénin"], languages: ["français"] } });
  const owner = await login(users[0]);
  await owner.goto(new URL(`/atlas/${solution.slug}`, origin).href);
  await owner.getByText("Je maintiens cette solution", { exact: true }).click();
  const claim = owner.locator("form").filter({ has: owner.locator('textarea[name="evidence"]') });
  await claim.evaluate(form => { form.noValidate = true; });
  await claim.locator('textarea[name="evidence"]').fill("court");
  await claim.getByRole("button").click();
  await claim.getByRole("alert").waitFor();
  assert.equal(await claim.locator('textarea[name="evidence"]').inputValue(), "court");
  await claim.locator('textarea[name="evidence"]').fill("Recette locale : contrôle du dépôt officiel et code personnel à vérifier par l’administrateur dédié.");
  await claim.getByRole("button").click();
  await owner.getByText(/Votre demande est enregistrée/).waitFor();
  const admin = await login(users[2]);
  await admin.goto(new URL("/admin/atlas", origin).href);
  const review = admin.locator("section").filter({ has: admin.getByRole("link", { name: solution.name, exact: true }) });
  await review.locator('[name="status"]').selectOption("APPROVED");
  await review.locator('[name="note"]').fill("Recette locale isolée : preuve contrôlée par un compte administrateur indépendant.");
  await review.locator('[name="confirmed"]').check();
  await review.getByRole("button", { name: "Enregistrer la décision" }).click();
  await membershipCount(1);
  await owner.goto(new URL(`/atlas/${solution.slug}/edit`, origin).href);
  const invite = owner.locator("form").filter({ has: owner.locator('[name="username"]') });
  await invite.locator('[name="username"]').fill(users[1].username);
  await invite.getByRole("button").click();
  await invite.getByRole("status").waitFor();
  await membershipCount(1);
  const recipient = await login(users[1]);
  await recipient.goto(new URL("/dashboard/atlas", origin).href);
  const response = recipient.locator("article").filter({ has: recipient.getByRole("link", { name: solution.name, exact: true }) });
  await response.locator('[name="decision"]').selectOption("ACCEPT");
  await response.getByRole("button").click();
  await membershipCount(2);
  await owner.reload();
  await invite.locator('[name="username"]').fill(users[2].username);
  await invite.locator('[name="kind"]').selectOption("TRANSFER");
  await invite.getByRole("button").click();
  await invite.getByRole("status").waitFor();
  await admin.goto(new URL("/dashboard/atlas", origin).href);
  const transfer = admin.locator("article").filter({ has: admin.getByRole("link", { name: solution.name, exact: true }) });
  await transfer.locator('[name="decision"]').selectOption("ACCEPT");
  await transfer.getByRole("button").click();
  for (let i = 0; i < 50 && await db.solutionMaintainer.count({ where: { solutionId: solution.id, userId: users[0].id } }); i++) await new Promise(resolve => setTimeout(resolve, 200));
  assert.equal(await db.solutionMaintainer.count({ where: { solutionId: solution.id, userId: users[0].id } }), 0);
  const publicContext = await browser.newContext({ viewport: { width: 390, height: 844 } }); contexts.push(publicContext);
  const mobile = await publicContext.newPage();
  await mobile.goto(new URL(`/atlas?q=${nonce}&country=${encodeURIComponent("Bénin")}`, origin).href);
  await mobile.getByRole("link", { name: solution.name, exact: true }).waitFor();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mobile.screenshot({ path: join(output, "atlas-mobile.png"), fullPage: true });
  await recipient.goto(new URL(`/atlas/${solution.slug}/edit`, origin).href);
  await recipient.screenshot({ path: join(output, "atlas-team-desktop.png"), fullPage: true });
  await mobile.goto(new URL(`/atlas/${solution.slug}`, origin).href);
  assert.equal(await mobile.getByText(/code personnel à vérifier/).count(), 0);
  console.log(JSON.stringify({ ok: true, checks: ["credentials login", "invalid claim preserves input", "independent claim approval", "invite requires consent", "co-manager acceptance", "transfer removes sender only after acceptance", "mobile filters and no overflow", "private evidence not rendered anonymously"], screenshots: output }));
} finally {
  for (const context of contexts) await context.close();
  await browser.close();
  if (solution) { await db.auditLog.deleteMany({ where: { entityId: solution.id } }); await db.solution.deleteMany({ where: { id: solution.id } }); }
  await db.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
  await db.$disconnect();
}
