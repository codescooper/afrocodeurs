// @vitest-environment jsdom
import { createElement, useActionState } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ActionForm } from "../components/shared/action-form";

afterEach(cleanup);
type Result = { error?: string; success?: boolean } | undefined;
function Fixture({ save }: { save: (state: Result, data: FormData) => Promise<Result> }) {
  const [state, action, pending] = useActionState(save, undefined);
  return createElement(ActionForm, { action, pending, resetAfterSuccess: state?.success ? state : undefined },
    createElement("input", { name: "title", defaultValue: "initial" }),
    createElement("textarea", { name: "body" }),
    createElement("select", { name: "country", defaultValue: "CI" }, createElement("option", { value: "CI" }, "CI"), createElement("option", { value: "SN" }, "SN")),
    createElement("input", { name: "active", type: "checkbox" }),
    createElement("input", { name: "capacity", type: "number" }),
    createElement("input", { name: "password", type: "password" }),
    createElement("input", { name: "file", type: "file" }),
    createElement("button", { type: "submit", name: "decision", value: "draft", disabled: pending }, "Envoyer"),
    createElement("p", { role: "status" }, state?.error ?? (state?.success ? "Enregistré" : "")));
}

it("keeps every input type after repeated server errors and allows a retry", async () => {
  const save = vi.fn().mockResolvedValue({ error: "Corrige les champs." });
  const view = render(createElement(Fixture, { save }));
  const form = view.container.querySelector("form")!;
  const values = { title: "Mon projet", body: "Un long brouillon", country: "SN", capacity: "4", password: "dummy-local-test" };
  for (const [name, value] of Object.entries(values)) fireEvent.change(form.querySelector(`[name="${name}"]`)!, { target: { value } });
  fireEvent.click(form.querySelector('[name="active"]')!);
  const file = new File(["fixture"], "fixture.txt", { type: "text/plain" });
  fireEvent.change(form.querySelector('[name="file"]')!, { target: { files: [file] } });
  for (let attempt = 1; attempt <= 2; attempt++) {
    fireEvent.submit(form);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(attempt));
    await waitFor(() => expect(view.getByRole("status").textContent).toBe("Corrige les champs."));
    for (const [name, value] of Object.entries(values)) expect((form.querySelector(`[name="${name}"]`) as HTMLInputElement).value).toBe(value);
    expect((form.querySelector('[name="active"]') as HTMLInputElement).checked).toBe(true);
    expect((form.querySelector('[name="file"]') as HTMLInputElement).files?.[0]).toBe(file);
  }
});

it("clears inputs only after an explicitly confirmed success", async () => {
  const save = vi.fn().mockResolvedValueOnce({ error: "Refusé" }).mockResolvedValueOnce({ success: true });
  const view = render(createElement(Fixture, { save }));
  const form = view.container.querySelector("form")!;
  const body = form.querySelector("textarea")!;
  fireEvent.change(body, { target: { value: "Mon commentaire" } });
  fireEvent.submit(form);
  await waitFor(() => expect(view.getByRole("status").textContent).toBe("Refusé"));
  expect(body.value).toBe("Mon commentaire");
  fireEvent.submit(form);
  await waitFor(() => expect(view.getByRole("status").textContent).toBe("Enregistré"));
  await waitFor(() => expect(body.value).toBe(""));
});

it("includes the submit button name and value", async () => {
  const save = vi.fn().mockResolvedValue({ error: "Refusé" });
  const view = render(createElement(Fixture, { save }));
  fireEvent.click(view.getByRole("button", { name: "Envoyer" }));
  await waitFor(() => expect(save).toHaveBeenCalledOnce());
  expect(save.mock.calls[0][1].get("decision")).toBe("draft");
});

it("does not dispatch a cancelled or pending submission", () => {
  const action = vi.fn();
  const view = render(createElement(ActionForm, { action, pending: true }, createElement("button", null, "Envoyer")));
  fireEvent.submit(view.container.querySelector("form")!);
  expect(action).not.toHaveBeenCalled();
  view.rerender(createElement(ActionForm, { action, onSubmit: event => event.preventDefault() }, createElement("button", null, "Envoyer")));
  fireEvent.submit(view.container.querySelector("form")!);
  expect(action).not.toHaveBeenCalled();
});
