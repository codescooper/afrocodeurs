// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const { save } = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("../features/mentorship/actions", () => ({ mentorshipAction: save }));
import { MentorshipForm } from "../features/mentorship/action-form";
import { mentorshipSchema, mentorshipValidationMessage } from "../features/mentorship/validators";

afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("preserves text, capacity and checkbox after a rejected submission", async () => {
  save.mockResolvedValue({ error: "Précise tes créneaux." });
  const view = render(createElement(MentorshipForm, { fields: { command: "offer" }, label: "Proposer mon aide" },
    createElement("input", { name: "title" }),
    createElement("textarea", { name: "description" }),
    createElement("input", { name: "capacity", type: "number", defaultValue: "2" }),
    createElement("input", { name: "active", type: "checkbox", defaultChecked: true }),
  ));
  const title = view.container.querySelector<HTMLInputElement>('[name="title"]')!;
  const description = view.container.querySelector<HTMLTextAreaElement>("textarea")!;
  const capacity = view.container.querySelector<HTMLInputElement>('[name="capacity"]')!;
  const active = view.container.querySelector<HTMLInputElement>('[name="active"]')!;
  fireEvent.change(title, { target: { value: "Accompagnement React" } });
  fireEvent.change(description, { target: { value: "Ma description de mentorat" } });
  fireEvent.change(capacity, { target: { value: "4" } });
  fireEvent.click(active);
  fireEvent.submit(view.container.querySelector("form")!);
  await waitFor(() => expect(view.getByRole("status").textContent).toBe("Précise tes créneaux."));
  expect(title.value).toBe("Accompagnement React");
  expect(description.value).toBe("Ma description de mentorat");
  expect(capacity.value).toBe("4");
  expect(active.checked).toBe(false);
  expect(save.mock.calls[0][1].get("command")).toBe("offer");
});

it("preserves a mentorship request when the server refuses it", async () => {
  save.mockResolvedValue({ error: "Toutes les places sont prises." });
  const view = render(createElement(MentorshipForm, { fields: { command: "request", id: "offer-1" }, label: "Envoyer ma demande" }, createElement("textarea", { name: "message" })));
  const message = view.container.querySelector("textarea")!;
  fireEvent.change(message, { target: { value: "Je souhaite un accompagnement pour mon premier projet." } });
  fireEvent.submit(view.container.querySelector("form")!);
  await waitFor(() => expect(view.getByRole("status").textContent).toBe("Toutes les places sont prises."));
  expect(message.value).toBe("Je souhaite un accompagnement pour mon premier projet.");
  expect(save.mock.calls[0][1].get("id")).toBe("offer-1");
});

it("explains invalid fields and commands in French", () => {
  const input = { command: "offer", title: "React", description: "x".repeat(40), topics: "react", languages: "français", availability: "Le samedi UTC", capacity: 2, active: true };
  for (const [patch, expected] of [
    [{ title: "a" }, "Le titre"],
    [{ topics: "" }, "sujets"],
    [{ capacity: 9 }, "suivis simultanés"],
    [{ command: "unknown" }, "Cette demande est invalide"],
  ] as const) {
    const result = mentorshipSchema.safeParse({ ...input, ...patch });
    expect(result.success).toBe(false);
    if (!result.success) expect(mentorshipValidationMessage(result.error)).toContain(expected);
  }
});
