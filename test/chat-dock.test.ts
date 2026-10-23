// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../features/messaging/chat-room", () => ({ ChatRoom: ({ conversationId }: { conversationId: string }) => createElement("textarea", { "aria-label": `Brouillon ${conversationId}` }) }));
import { ChatDock } from "../features/messaging/chat-dock";

afterEach(() => { cleanup(); sessionStorage.clear(); vi.unstubAllGlobals(); });
it("renders conversation photos and visible fallback initials without clipping unread badges", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ authenticated: true, currentUserId: "me", verified: true, general: { id: "general", updatedAt: "2026-10-22T10:00:00Z" }, conversations: [{ id: "awa", title: "Awa Diop", image: "/uploads/awa.png", preview: "Bonjour", unread: 2 }, { id: "salon", title: "Salon Dakar", image: null, preview: "Bienvenue", unread: 0 }] }) }));
  const view = render(createElement(ChatDock));
  await waitFor(() => expect(view.getByRole("button", { name: "Awa Diop" })).toBeTruthy());
  const link = view.getByRole("button", { name: "Awa Diop" });
  expect(link.querySelector("img")?.getAttribute("src")).toBe("/uploads/awa.png");
  expect(link.className).not.toContain("overflow-hidden");
  expect(link.textContent).toContain("2");
  expect(view.getByRole("button", { name: "Salon Dakar" }).textContent).toBe("SD");
  fireEvent.click(link);
  expect(view.getByRole("region", { name: "Discussion : Awa Diop" })).toBeTruthy();
  const draft = view.getByRole("textbox", { name: "Brouillon awa" });
  fireEvent.change(draft, { target: { value: "Je continue pendant ma navigation" } });
  fireEvent.click(view.getByRole("button", { name: "Réduire la discussion" }));
  expect(view.queryByRole("region", { name: "Discussion : Awa Diop" })).toBeNull();
  view.rerender(createElement(ChatDock));
  fireEvent.click(view.getByRole("button", { name: "Awa Diop" }));
  expect((view.getByRole("textbox", { name: "Brouillon awa" }) as HTMLTextAreaElement).value).toBe("Je continue pendant ma navigation");
  expect(view.getByRole("link", { name: "Ouvrir la page complète" }).getAttribute("href")).toBe("/messages/awa");
  fireEvent.click(view.getByRole("button", { name: "Salon Dakar" }));
  expect(view.getByRole("region", { name: "Discussion : Salon Dakar" })).toBeTruthy();
  fireEvent.click(view.getByRole("button", { name: "Awa Diop" }));
  expect((view.getByRole("textbox", { name: "Brouillon awa" }) as HTMLTextAreaElement).value).toBe("Je continue pendant ma navigation");
  fireEvent.click(view.getByRole("button", { name: "Fermer la discussion" }));
  expect(view.queryByRole("region", { name: "Discussion : Awa Diop" })).toBeNull();
});

it("keeps closed bubbles hidden after remount and restores them for a new incoming message", async () => {
  const item = { id: "awa", title: "Awa", image: null, preview: "Bonjour", updatedAt: "2026-10-23T10:00:00Z", unread: 1, lastMessageAuthorId: "other" };
  const summary = { authenticated: true, currentUserId: "bubble-owner", verified: true, general: { id: "general", updatedAt: item.updatedAt }, conversations: [item] };
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => ({ ok: true, json: async () => summary })));
  let view = render(createElement(ChatDock));
  await waitFor(() => expect(view.getByRole("button", { name: "Fermer la bulle Awa" })).toBeTruthy());
  fireEvent.click(view.getByRole("button", { name: "Fermer la bulle Awa" }));
  expect(view.queryByRole("button", { name: "Awa" })).toBeNull();
  view.unmount(); view = render(createElement(ChatDock));
  await waitFor(() => expect(view.getByRole("button", { name: "Ouvrir le panneau Chat" })).toBeTruthy());
  expect(view.queryByRole("button", { name: "Awa" })).toBeNull();
  view.unmount();
  item.updatedAt = "2026-10-23T10:01:00Z";
  view = render(createElement(ChatDock));
  await waitFor(() => expect(view.getByRole("button", { name: "Awa" })).toBeTruthy());
});

it("opens the Chat chooser before entering general chat", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url) => ({ ok: true, json: async () => String(url).includes("contacts") ? { online: [], offline: [], nextOffset: null } : { authenticated: true, currentUserId: "chooser", verified: true, general: { id: "general", updatedAt: "2026-10-23" }, conversations: [] } })));
  const view = render(createElement(ChatDock));
  await waitFor(() => expect(view.getByRole("button", { name: "Ouvrir le panneau Chat" })).toBeTruthy());
  fireEvent.click(view.getByRole("button", { name: "Ouvrir le panneau Chat" }));
  expect(view.getByRole("region", { name: "Choisir une discussion" })).toBeTruthy();
  fireEvent.click(view.getByRole("button", { name: "Chat général" }));
  expect(view.getByRole("region", { name: "Discussion : Chat général" })).toBeTruthy();
  expect(view.queryByRole("region", { name: "Choisir une discussion" })).toBeNull();
});
