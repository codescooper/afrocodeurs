import { beforeEach, expect, it, vi } from "vitest";
const queries = vi.hoisted(() => Object.fromEntries(["problem", "knowledge", "solution", "question", "community", "project", "event", "communityVenture", "mentorshipOffer", "challenge", "opportunity"].map(name => [name, { findMany: vi.fn() }])));
vi.mock("@/lib/db", () => ({ db: queries }));
import sitemap from "../app/sitemap";

beforeEach(() => { for (const model of Object.values(queries)) model.findMany.mockReset().mockResolvedValue([]); });

it("includes discoverable public hubs and only safe entity fields", async () => {
  const date = new Date("2026-10-26T00:00:00Z");
  queries.communityVenture.findMany.mockResolvedValue([{ slug: "public-service", updatedAt: date }]);
  const entries = await sitemap();
  for (const path of ["/a-propos", "/communities", "/projects", "/constellation", "/mentorship", "/challenges"]) expect(entries.some(entry => entry.url.endsWith(path))).toBe(true);
  expect(entries.find(entry => entry.url.endsWith("/constellation/public-service"))?.lastModified).toEqual(date);
  expect(entries.find(entry => entry.url.endsWith("/a-propos"))?.lastModified).toBeUndefined();
  expect(entries.some(entry => /\/(admin|dashboard|messages|api|register)(\/|$)/.test(new URL(entry.url).pathname))).toBe(false);
  expect(queries.communityVenture.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }));
  expect(queries.mentorshipOffer.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { active: true, suspendedAt: null, mentor: { emailVerified: { not: null } } } }));
  expect(queries.challenge.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: { in: ["PUBLISHED", "CLOSED"] } } }));
  expect(queries.opportunity.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "ACTIVE" } }));
});
