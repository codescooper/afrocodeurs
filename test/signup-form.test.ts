// @vitest-environment jsdom
import { createElement, useEffect } from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ register: vi.fn(), mounts: 0 }));
vi.mock("@/features/auth/actions", () => ({ registerAction: mocks.register }));
vi.mock("@/features/auth/turnstile-widget", () => ({ TurnstileWidget: ({ onReadyChange }: { onReadyChange: (v: boolean) => void }) => {
  useEffect(() => { mocks.mounts++; onReadyChange(true); }, [onReadyChange]); return null;
} }));
vi.mock("@/features/auth/pow-widget", () => ({ PowWidget: ({ onReadyChange }: { onReadyChange: (v: boolean) => void }) => {
  useEffect(() => { onReadyChange(true); }, [onReadyChange]); return null;
} }));
import { RegisterForm } from "../features/auth/register-form";
afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.mounts = 0; });
it("retains all fields and renews both checks after a server error", async () => {
  mocks.register.mockResolvedValue({ error: "Cet email ou ce nom d'utilisateur est déjà pris." });
  const view = render(createElement(RegisterForm, { turnstileSiteKey: "runtime", powEnabled: true }));
  const fields = { name: "Awa", username: "AWA_TEST", email: "awa@example.test", password: "Password123!" };
  for (const [name, value] of Object.entries(fields)) fireEvent.change(view.container.querySelector(`[name=${name}]`)!, { target: { value } });
  const button = view.getByRole("button", { name: "Créer mon compte" }) as HTMLButtonElement;
  await waitFor(() => expect(button.disabled).toBe(false));
  await act(async () => { fireEvent.submit(view.container.querySelector("form")!); });
  await waitFor(() => expect(view.getByRole("alert").textContent).toContain("déjà pris"));
  for (const [name, value] of Object.entries(fields)) expect((view.container.querySelector(`[name=${name}]`) as HTMLInputElement).value).toBe(name === "username" ? value.toLowerCase() : value);
  expect(mocks.mounts).toBe(2);
  expect(mocks.register.mock.calls[0][1].get("username")).toBe("awa_test");
});
