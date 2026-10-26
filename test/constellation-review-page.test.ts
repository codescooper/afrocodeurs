import { beforeEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const { auth, findMany } = vi.hoisted(() => ({ auth: vi.fn(), findMany: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/db", () => ({ db: { communityVenture: { findMany } } }));
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("redirect"); } }));
vi.mock("@/features/constellation/action-form", () => ({ VentureActionForm: ({ label }: { label: string }) => createElement("button", null, label) }));
import ReviewPage from "../app/admin/constellation/page";
beforeEach(() => {
  vi.resetAllMocks();
  findMany.mockResolvedValue([{ id: "v", ownerId: "owner", slug: "fiche", revision: 1, name: "Projet", summary: "Résumé", description: "Description", websiteUrl: "https://example.org", owner: { username: "awa" } }]);
});
it("shows admin self-approval and its audit warning", async () => {
  auth.mockResolvedValue({ user: { id: "owner", role: "ADMIN", isEmailVerified: true } });
  const html = renderToStaticMarkup(await ReviewPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("Publier ma fiche");
  expect(html).toContain("auto-validation administrateur");
});
it("shows the independent-review restriction for moderator-owned ventures", async () => {
  auth.mockResolvedValue({ user: { id: "owner", role: "MODERATOR", isEmailVerified: true } });
  const html = renderToStaticMarkup(await ReviewPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("une autre personne de la modération");
  expect(html).not.toContain("<button");
});
it("still lets moderators review another member", async () => {
  auth.mockResolvedValue({ user: { id: "moderator", role: "MODERATOR", isEmailVerified: true } });
  const html = renderToStaticMarkup(await ReviewPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("Publier la fiche");
});
