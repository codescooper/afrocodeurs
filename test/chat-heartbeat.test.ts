// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ChatPresenceHeartbeat } from "../features/messaging/chat-presence";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
it("does not announce a hidden or idle tab as active", async () => {
  vi.useFakeTimers();
  const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  const fetcher = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetcher);
  render(createElement(ChatPresenceHeartbeat));
  expect(fetcher).not.toHaveBeenCalled();
  visibility.mockReturnValue("visible");
  fireEvent(document, new Event("visibilitychange"));
  await act(async () => { vi.advanceTimersByTime(150000); });
  expect(fetcher).toHaveBeenCalledTimes(3);
  fireEvent.keyDown(window, { key: "a" });
  await act(async () => { vi.advanceTimersByTime(30000); });
  expect(fetcher).toHaveBeenCalledTimes(4);
});
