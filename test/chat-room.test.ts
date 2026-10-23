// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/features/admin/report-form", () => ({ ReportForm: () => null }));
import { ChatRoom } from "../features/messaging/chat-room";
beforeEach(() => { Element.prototype.scrollIntoView = vi.fn(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("pauses polling while minimized and resumes when reopened", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ messages: [], hasMore: false }) });
  vi.stubGlobal("fetch", fetcher);
  const props = { conversationId: "c1", currentUserId: "me", initialMessages: [], compact: true };
  const view = render(createElement(ChatRoom, { ...props, paused: true }));
  expect(fetcher).not.toHaveBeenCalled();
  view.rerender(createElement(ChatRoom, { ...props, paused: false }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
});
it("removes a stale window when access is revoked", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
  const onUnavailable = vi.fn();
  render(createElement(ChatRoom, { conversationId: "c1", currentUserId: "me", initialMessages: [], onUnavailable }));
  await waitFor(() => expect(onUnavailable).toHaveBeenCalledOnce());
});
it("retains the draft and re-enables sending after a network failure", async () => {
  vi.stubGlobal("fetch", vi.fn((_url, options) => options?.method === "POST" ? Promise.reject(new Error("offline")) : Promise.resolve({ ok: true, json: async () => ({ messages: [] }) })));
  const view = render(createElement(ChatRoom, { conversationId: "c1", currentUserId: "me", initialMessages: [] }));
  const draft = view.getByPlaceholderText("Écrivez un message…") as HTMLTextAreaElement;
  fireEvent.change(draft, { target: { value: "Mon brouillon" } });
  fireEvent.submit(draft.closest("form")!);
  await waitFor(() => expect(view.getByText("Envoi impossible. Votre brouillon est conservé.")).toBeTruthy());
  expect(draft.value).toBe("Mon brouillon");
  expect((view.getByRole("button", { name: "Envoyer" }) as HTMLButtonElement).disabled).toBe(false);
});
