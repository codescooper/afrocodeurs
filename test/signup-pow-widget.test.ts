// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PowWidget } from "../features/auth/pow-widget";
class TestWorker {
  static instances: TestWorker[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = vi.fn(); postMessage = vi.fn();
  constructor() { TestWorker.instances.push(this); }
}
beforeEach(() => { vi.useFakeTimers(); TestWorker.instances = []; vi.stubGlobal("Worker", TestWorker); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
function fetchChallenge(expires = 300000) {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => ({ ok: true, json: async () => ({ enabled: true, challenge: "signed", difficulty: 18, expiresAt: Date.now()+expires }) })));
}
it("uses runtime activation and waits for found, not progress", async () => {
  fetchChallenge(); const ready = vi.fn();
  render(createElement(PowWidget, { enabled: true, onReadyChange: ready }));
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  act(() => TestWorker.instances[0].onmessage!({ data: { type: "progress", attempts: 10 } }));
  expect(ready).not.toHaveBeenCalledWith(true);
  act(() => TestWorker.instances[0].onmessage!({ data: { type: "found", nonce: 42 } }));
  expect(ready).toHaveBeenLastCalledWith(true);
});
it("does not declare readiness when the API disagrees with the server configuration", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ enabled: false }) }));
  const ready = vi.fn(); const view = render(createElement(PowWidget, { enabled: true, onReadyChange: ready }));
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(ready).not.toHaveBeenCalledWith(true); expect(view.getByText(/Vérification indisponible/)).toBeTruthy();
});
it("times out, permits retry and terminates the old worker", async () => {
  fetchChallenge(); const ready = vi.fn(); const view = render(createElement(PowWidget, { enabled: true, onReadyChange: ready }));
  await act(async () => { await vi.advanceTimersByTimeAsync(60001); });
  expect(TestWorker.instances[0].terminate).toHaveBeenCalled();
  fireEvent.click(view.getByRole("button", { name: "Réessayer" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(TestWorker.instances).toHaveLength(2);
});
it("renews an expired proof instead of leaving the button ready", async () => {
  fetchChallenge(1000); const ready = vi.fn(); render(createElement(PowWidget, { enabled: true, onReadyChange: ready }));
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  act(() => TestWorker.instances[0].onmessage!({ data: { type: "found", nonce: 1 } }));
  await act(async () => { await vi.advanceTimersByTimeAsync(1001); });
  expect(ready).toHaveBeenLastCalledWith(false); expect(TestWorker.instances).toHaveLength(2);
});
it("skips work only when the server explicitly disabled it", () => {
  const ready = vi.fn(); render(createElement(PowWidget, { enabled: false, onReadyChange: ready }));
  expect(ready).toHaveBeenCalledWith(true); expect(TestWorker.instances).toHaveLength(0);
});
it("also bounds a challenge response whose body stalls after headers", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url, init: { signal: AbortSignal }) => ({
    ok: true, json: () => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }),
  })));
  const ready = vi.fn(); const view = render(createElement(PowWidget, { enabled: true, onReadyChange: ready }));
  await act(async () => { await vi.advanceTimersByTimeAsync(10001); });
  expect(view.getByRole("button", { name: "Réessayer" })).toBeTruthy();
  expect(ready).not.toHaveBeenCalledWith(true);
});
