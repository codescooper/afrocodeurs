// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ usePathname: () => "/register" }));
import { CookieBanner } from "../components/layout/cookie-banner";
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });
it("reserves the measured fixed banner height and releases it after dismissal", async () => {
  vi.useFakeTimers();
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ height: 180 } as DOMRect);
  const view = render(createElement(CookieBanner));
  await act(async () => { await vi.runOnlyPendingTimersAsync(); });
  await act(async () => { await vi.runOnlyPendingTimersAsync(); });
  expect((view.container.querySelector("[data-cookie-banner-spacer]") as HTMLElement).style.height).toBe("212px");
  expect(view.getByRole("region", { name: "Information sur les cookies" })).toBeTruthy();
  fireEvent.click(view.getByRole("button", { name: "J'ai compris" }));
  expect(view.container.querySelector("[data-cookie-banner-spacer]")).toBeNull();
});
it("updates the reserved space when the viewport changes", async () => {
  vi.useFakeTimers(); let height = 180;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ height } as DOMRect));
  const view = render(createElement(CookieBanner));
  await act(async () => { await vi.runOnlyPendingTimersAsync(); });
  await act(async () => { await vi.runOnlyPendingTimersAsync(); });
  height = 240; fireEvent(window, new Event("resize"));
  expect((view.container.querySelector("[data-cookie-banner-spacer]") as HTMLElement).style.height).toBe("272px");
});
