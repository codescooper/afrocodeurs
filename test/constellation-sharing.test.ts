import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../features/constellation/queries", () => ({ ventureDetail: query }));
vi.mock("../features/constellation/venture-mark", () => ({ VentureMark: () => null }));
vi.mock("../features/constellation/action-form", () => ({ VentureActionForm: () => null }));
vi.mock("@/features/comments/comment-section", () => ({ CommentSection: () => null }));
vi.mock("@/features/admin/report-form", () => ({ ReportForm: () => null }));
vi.mock("@/components/shared/content-share", () => ({ ContentShare: () => createElement("div", { "data-public-share": true }, "Partager") }));
import { VentureDetail } from "../features/constellation/detail";

describe("Constellation public sharing", () => {
  it.each(["PENDING", "SUSPENDED", "ARCHIVED", "PUBLISHED"])("only exposes sharing for a published venture: %s", async (status) => {
    query.mockResolvedValue({ venture: { id: "v1", slug: "mon-projet", name: "Mon projet", summary: "Resume", description: "Description", country: "SN", sector: "HEALTH", status, websiteUrl: "https://example.org", screenshots: [], needs: [], owner: { username: "awa" }, openSourceProject: null }, session: null, owner: true, collaboration: null });
    const html = renderToStaticMarkup(await VentureDetail({ slug: "mon-projet" }));
    expect(html.includes("data-public-share")).toBe(status === "PUBLISHED");
  });
});
