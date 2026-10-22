// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../features/messaging/chat-room", () => ({ ChatRoom: () => null }));
import { ChatDock } from "../features/messaging/chat-dock";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("renders conversation photos and visible fallback initials without clipping unread badges", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ authenticated: true, currentUserId: "me", verified: true, general: { id: "general", updatedAt: "2026-10-22T10:00:00Z" }, conversations: [{ id: "awa", title: "Awa Diop", image: "/uploads/awa.png", preview: "Bonjour", unread: 2 }, { id: "salon", title: "Salon Dakar", image: null, preview: "Bienvenue", unread: 0 }] }) }));
  const view = render(createElement(ChatDock));
  await waitFor(() => expect(view.getByRole("link", { name: "Awa Diop" })).toBeTruthy());
  const link = view.getByRole("link", { name: "Awa Diop" });
  expect(link.querySelector("img")?.getAttribute("src")).toBe("/uploads/awa.png");
  expect(link.className).not.toContain("overflow-hidden");
  expect(link.textContent).toContain("2");
  expect(view.getByRole("link", { name: "Salon Dakar" }).textContent).toBe("SD");
});
