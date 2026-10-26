import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), solution: vi.fn(), claim: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ db: { solution: { findUnique: mocks.solution, update: vi.fn() }, solutionClaim: { findUnique: mocks.claim }, entityRelation: { findMany: vi.fn(async () => []) } } }));
vi.mock("@/features/seo/metadata", () => ({ publicContentMetadata: vi.fn() }));
vi.mock("@/features/admin/report-form", () => ({ ReportForm: () => null }));
vi.mock("@/components/shared/content-share", () => ({ ContentShare: () => null }));
vi.mock("@/features/solutions/claim-forms", () => ({ ClaimForm: () => "claim form", LicenseReviewForm: () => "admin license form", GithubProofForm: () => "github proof form" }));
import SolutionDetailPage from "../app/(public)/atlas/[slug]/page";

const solution = { id: "solution", slug: "solution", name: "Solution", type: "SOFTWARE", description: "Description", country: "Bénin", license: "MIT", licenseVerified: false, lifecycle: "USABLE", sector: "EDUCATION", countriesServed: ["Sénégal"], languages: ["français"], projects: [], maintainers: [], createdBy: { username: "referencer", name: null }, views: 0, africanContext: "", contributionNeeds: "", revision: 1 };
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue(null); mocks.solution.mockResolvedValue(solution); mocks.claim.mockResolvedValue(null); });
const render = async () => renderToStaticMarkup(await SolutionDetailPage({ params: Promise.resolve({ slug: "solution" }) }));

it("does not query or render private claims for anonymous visitors", async () => {
  mocks.claim.mockResolvedValue({ id: "private-claim", evidence: "private evidence", reviewNote: "private decision", status: "PENDING" });
  const html = await render();
  expect(mocks.claim).not.toHaveBeenCalled();
  expect(html).not.toContain("private-claim");
  expect(html).not.toContain("private decision");
  expect(html).not.toContain("/edit");
  expect(html).toContain("Licence open source à vérifier");
  expect(html).toContain("Sénégal");
});
it("queries only the signed-in member's own claim", async () => {
  mocks.auth.mockResolvedValue({ user: { id: "viewer", role: "USER" } });
  mocks.claim.mockResolvedValue({ id: "own-claim", status: "PENDING", reviewNote: null });
  const html = await render();
  expect(mocks.claim).toHaveBeenCalledWith(expect.objectContaining({ where: { solutionId_userId: { solutionId: "solution", userId: "viewer" } } }));
  expect(html).toContain("afrocodeurs:own-claim:viewer");
  expect(html).not.toContain("admin license form");
});
it("shows editing to a verified maintainer, not the referencing author by default", async () => {
  mocks.auth.mockResolvedValue({ user: { id: "member", role: "USER" } });
  mocks.solution.mockResolvedValue({ ...solution, maintainers: [{ userId: "member", user: { username: "member", name: "Mainteneur" } }] });
  expect(await render()).toContain('href="/atlas/solution/edit"');
});
