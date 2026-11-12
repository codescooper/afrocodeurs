// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AfricaPresenceMap } from "../components/presence/africa-presence-map";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("displays historical and active counts and withdraws the current browser's point", async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ points: [
    { latitude: 5.5, longitude: -4, active: 1, previous: 3 },
  ] }) });
  vi.stubGlobal("fetch", fetch);
  const view = render(createElement(AfricaPresenceMap, { mapGeometry: null, countryRanking: [] }));
  await waitFor(() => expect(view.getByText("3 précédemment")).toBeTruthy());
  expect(view.getByText("1 présences récentes")).toBeTruthy();
  expect(view.queryByText(/30 derniers jours/)).toBeNull();
  fireEvent.click(view.getByRole("button", { name: "Retirer ma position" }));
  await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/presence", { method: "DELETE" }));
  await waitFor(() => expect(view.getByText(/a été retirée/)).toBeTruthy());
});
