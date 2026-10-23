import { expect, it } from "vitest";
import { chatOnline, CHAT_ACTIVE_MS } from "../features/messaging/presence";
import { bubbleVisible } from "../features/messaging/bubbles";

it("expires presence without needing a disconnect event", () => {
  const now = Date.parse("2026-10-23T10:00:00Z");
  expect(chatOnline(null, now)).toBe(false);
  expect(chatOnline(new Date(now - CHAT_ACTIVE_MS), now)).toBe(true);
  expect(chatOnline(new Date(now - CHAT_ACTIVE_MS - 1), now)).toBe(false);
});
it("keeps a dismissed bubble hidden across refreshes until a new incoming unread message", () => {
  const closed = { chat: "2026-10-23T10:00:00Z" };
  const item = { id: "chat", updatedAt: closed.chat, unread: 4, lastMessageAuthorId: "other" };
  expect(bubbleVisible(item, closed, "me")).toBe(false);
  expect(bubbleVisible({ ...item, updatedAt: "2026-10-23T10:01:00Z" }, closed, "me")).toBe(true);
  expect(bubbleVisible({ ...item, updatedAt: "2026-10-23T10:01:00Z", lastMessageAuthorId: "me" }, closed, "me")).toBe(false);
  expect(bubbleVisible({ ...item, updatedAt: "2026-10-23T10:01:00Z", unread: 0 }, closed, "me")).toBe(false);
  expect(bubbleVisible(item, {}, "me")).toBe(true);
});
