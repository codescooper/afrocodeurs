import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), get: vi.fn(), redirect: vi.fn((path: string) => { throw new Error("REDIRECT:"+path); }) }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.get }) }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import Page from "../app/construction/page";
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue(null); mocks.get.mockReturnValue(undefined); });
it("sends a signed-in member home even when the puzzle was already solved", async () => {
  mocks.auth.mockResolvedValue({ user: { id: "member" } }); mocks.get.mockReturnValue({ value: "open" });
  await expect(Page()).rejects.toThrow("REDIRECT:/"); expect(mocks.redirect).toHaveBeenCalledWith("/");
});
it("sends an anonymous solver to registration", async () => {
  mocks.get.mockReturnValue({ value: "open" }); await expect(Page()).rejects.toThrow("REDIRECT:/register");
});
it("lets a visitor return to solve the puzzle", async () => {
  expect(await Page()).toBeTruthy(); expect(mocks.redirect).not.toHaveBeenCalled();
});
