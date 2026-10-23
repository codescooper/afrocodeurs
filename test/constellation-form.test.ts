// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { save } = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("../features/constellation/actions", () => ({ saveVentureAction: save, collaborationAction: save, archiveVentureAction: save, reviewVentureAction: save }));
vi.mock("@/features/media/image-upload", () => ({ ImageUploadButton: () => null }));
import { VentureForm } from "../features/constellation/venture-form";
import { VentureActionForm } from "../features/constellation/action-form";

afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("Constellation submission", () => {
  it("keeps a collaboration message after a business error", async () => {
    save.mockResolvedValue({ error: "Reessaie plus tard." });
    const view = render(createElement(VentureActionForm, { fields: { id: "v1", command: "request" }, label: "Proposer" }, createElement("textarea", { name: "message" })));
    const textarea = view.container.querySelector("textarea")!;
    fireEvent.change(textarea, { target: { value: "Je propose de contribuer aux tests de votre service." } });
    fireEvent.submit(view.container.querySelector("form")!);
    await waitFor(() => expect(view.getByRole("status").textContent).toBe("Reessaie plus tard."));
    expect(textarea.value).toBe("Je propose de contribuer aux tests de votre service.");
  });
  it("keeps all entered fields and confirmation after a server rejection", async () => {
    save.mockResolvedValue({ error: "Ce lien existe deja." });
    const view = render(createElement(VentureForm, { projects: [{ id: "oss", name: "Mon depot" }] }));
    const values = { name: "Ma realisation", summary: "Une description courte de notre service", description: "Un produit utile pour la communaute et les utilisateurs qui recherchent des solutions accessibles et fiables.", country: "SN", sector: "HEALTH", websiteUrl: "https://example.org", needs: "design, tests", openSourceProjectId: "oss" };
    for (const [name, value] of Object.entries(values)) fireEvent.change(view.container.querySelector(`[name="${name}"]`)!, { target: { value } });
    fireEvent.click(view.container.querySelector('[name="confirmed"]')!);
    expect((view.container.querySelector('[name="country"]') as HTMLSelectElement).value).toBe("SN");
    fireEvent.submit(view.container.querySelector("form")!);
    await waitFor(() => expect(view.getByRole("alert").textContent).toBe("Ce lien existe deja."));
    for (const [name, value] of Object.entries(values)) expect((view.container.querySelector(`[name="${name}"]`) as HTMLInputElement).value).toBe(value);
    expect((view.container.querySelector('[name="confirmed"]') as HTMLInputElement).checked).toBe(true);
    expect((view.getByRole("button", { name: "Envoyer en validation" }) as HTMLButtonElement).disabled).toBe(false);
  });
  it("prevents a duplicate submission after success", async () => {
    save.mockResolvedValue({ success: "Fiche enregistree." });
    const view = render(createElement(VentureForm, { projects: [] }));
    fireEvent.submit(view.container.querySelector("form")!);
    await waitFor(() => expect((view.getByRole("button", { name: "Fiche envoyée" }) as HTMLButtonElement).disabled).toBe(true));
    expect(view.getByRole("link", { name: "Mes réalisations" }).getAttribute("href")).toBe("/dashboard/constellation");
  });
});
