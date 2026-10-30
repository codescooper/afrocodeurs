// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("next/script", () => ({ default: ({ src }: { src: string }) => createElement("script", { "data-test-src": src }) }));
import { TurnstileWidget } from "../features/auth/turnstile-widget";
type Options = { callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void };
let options: Options;
let api: { render: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn>; reset: ReturnType<typeof vi.fn> };
beforeEach(() => {
  vi.useFakeTimers();
  api = { render: vi.fn((_el, opts: Options) => { options = opts; return "widget"; }), remove: vi.fn(), reset: vi.fn() };
  Object.assign(window, { turnstile: api });
});
afterEach(() => { cleanup(); vi.useRealTimers(); Reflect.deleteProperty(window, "turnstile"); });
it("passes the runtime key to the provider, clears expired tokens and resets", async () => {
  const ready = vi.fn(); const view = render(createElement(TurnstileWidget, { siteKey: "runtime-key", onReadyChange: ready }));
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(api.render.mock.calls[0][1].sitekey).toBe("runtime-key");
  act(() => options.callback("token")); expect(ready).toHaveBeenLastCalledWith(true);
  expect((view.container.querySelector("input") as HTMLInputElement).value).toBe("token");
  act(() => options["expired-callback"]()); expect(ready).toHaveBeenLastCalledWith(false);
  expect((view.container.querySelector("input") as HTMLInputElement).value).toBe(""); expect(api.reset).toHaveBeenCalledWith("widget");
  await act(async () => { await vi.advanceTimersByTimeAsync(60001); });
  expect(view.getByRole("button", { name: "Réessayer la vérification" })).toBeTruthy();
});
it("invalidates a previously valid token on error and retries without navigating", async () => {
  const ready = vi.fn(); const view = render(createElement(TurnstileWidget, { siteKey: "runtime-key", onReadyChange: ready }));
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  act(() => options.callback("token")); act(() => options["error-callback"]());
  const oldCallback = options.callback;
  expect(ready).toHaveBeenLastCalledWith(false); expect((view.container.querySelector("input") as HTMLInputElement).value).toBe("");
  fireEvent.click(view.getByRole("button", { name: "Réessayer la vérification" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(api.remove).toHaveBeenCalledWith("widget"); expect(api.render).toHaveBeenCalledTimes(2);
  act(() => oldCallback("stale-token"));
  expect((view.container.querySelector("input") as HTMLInputElement).value).toBe("");
});
it("shows a retry after bounded waiting and removes its widget on unmount", async () => {
  const view = render(createElement(TurnstileWidget, { siteKey: "runtime-key", onReadyChange: vi.fn() }));
  await act(async () => { await vi.advanceTimersByTimeAsync(60001); });
  expect(view.getByRole("alert")).toBeTruthy(); view.unmount(); expect(api.remove).toHaveBeenCalled();
});
it("remounts the failed script on retry, rather than reusing Next Script's failed load", async () => {
  Reflect.deleteProperty(window, "turnstile");
  const view = render(createElement(TurnstileWidget, { siteKey: "runtime-key", onReadyChange: vi.fn() }));
  const original = view.container.querySelector("script");
  await act(async () => { await vi.advanceTimersByTimeAsync(60001); });
  fireEvent.click(view.getByRole("button", { name: "Réessayer la vérification" }));
  const retry = view.container.querySelector("script");
  expect(retry).not.toBe(original); expect(retry?.getAttribute("data-test-src")).toContain("retry=1");
});
