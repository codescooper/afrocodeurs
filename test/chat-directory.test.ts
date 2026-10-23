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
