// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ChatDirectory } from "../features/messaging/chat-directory";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("offers general chat and opens both online and offline members without navigation", async () => {
  const conversation = { id: "direct", title: "Baba" };
  vi.stubGlobal("fetch", vi.fn((url) => Promise.resolve({ ok: true, json: async () => String(url).includes("/direct") ? { conversation } : { online: [{ id: "a", username: "awa", name: "Awa", image: null, online: true }], offline: [{ id: "b", username: "baba", name: "Baba", image: null, online: false }], nextOffset: null } })));
  const general = vi.fn(), open = vi.fn();
  const view = render(createElement(ChatDirectory, { onGeneral: general, onConversation: open, onClose: vi.fn() }));
  fireEvent.click(view.getByRole("button", { name: "Chat général" }));
  expect(general).toHaveBeenCalledOnce();
  await waitFor(() => expect(view.getByRole("button", { name: "Discuter avec Baba, hors ligne" })).toBeTruthy());
  expect(view.getByRole("button", { name: "Discuter avec Awa, en ligne" })).toBeTruthy();
  fireEvent.click(view.getByRole("button", { name: "Discuter avec Baba, hors ligne" }));
  await waitFor(() => expect(open).toHaveBeenCalledWith(conversation));
});
it("can reopen a closed group from recent conversations", () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ online: [], offline: [], nextOffset: null }) }));
  const open = vi.fn();
  const group = { id: "group", title: "Salon Dakar", image: null, preview: "", updatedAt: "2026-10-23", unread: 0 };
  const view = render(createElement(ChatDirectory, { onGeneral: vi.fn(), onConversation: open, onClose: vi.fn(), recent: [group] }));
  fireEvent.click(view.getByText("Conversations récentes"));
  fireEvent.click(view.getByRole("button", { name: "Reprendre Salon Dakar" }));
  expect(open).toHaveBeenCalledWith(group);
});
