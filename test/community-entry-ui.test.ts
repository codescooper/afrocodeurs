// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const router = vi.hoisted(() => ({ refresh: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/image", () => ({ default: () => null }));
import { CommunityEntry } from "../app/construction/community-entry";
beforeEach(() => { vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
it("offers visiting and progressive hints without writing puzzle progress", async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal("fetch", fetch);
  const view = render(createElement(CommunityEntry));
  expect(view.queryByText(/en construction/i)).toBeNull();
  fireEvent.click(view.getByRole("button", { name: "Besoin d’un indice ?" }));
  expect(fetch).not.toHaveBeenCalled(); expect(view.getByRole("status").textContent).toContain("fragments");
  fireEvent.click(view.getByRole("button", { name: /Simple visiteur/ }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  expect(router.refresh).toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledWith("/api/entry/visitor", expect.objectContaining({ method: "POST" }));
});
it("keeps the entrance usable after a network error and supports retry", async () => {
  const fetch = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ok: true }); vi.stubGlobal("fetch", fetch);
  const view = render(createElement(CommunityEntry));
  fireEvent.click(view.getByRole("button", { name: /Simple visiteur/ }));
  await waitFor(() => expect(view.getByRole("alert")).toBeTruthy());
  expect(view.getByRole("link", { name: "Voir les projets" }).getAttribute("href")).toBe("/projects");
  fireEvent.click(view.getByRole("button", { name: /Simple visiteur/ }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
});
