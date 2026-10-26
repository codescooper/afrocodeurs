// @vitest-environment jsdom
import { createElement, type ReactElement } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const { save } = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("@/features/problems/actions", () => ({ createProblemAction: save }));
vi.mock("@/features/communities/actions", () => ({ createCommunityAction: save }));
vi.mock("@/features/solutions/actions", () => ({ createSolutionAction: save }));
vi.mock("@/features/solutions/catalog-actions", () => ({ updateSolutionCatalogAction: save, requestSolutionClaimAction: save, reviewSolutionClaimAction: save, verifySolutionLicenseAction: save, checkSolutionGithubProofAction: save }));
vi.mock("@/features/solutions/team-actions", () => ({ inviteSolutionManagerAction: save, respondSolutionInvitationAction: save, removeSolutionManagerAction: save }));
vi.mock("@/features/projects/actions", () => ({ createProjectAction: save }));
vi.mock("@/features/events/actions", () => ({ createEventAction: save }));
vi.mock("@/features/compensation/actions", () => ({ createCompensationReportAction: save }));
vi.mock("@/features/admin/actions", () => ({ createReportAction: save }));
vi.mock("@/features/forum/actions", () => ({ addAnswerAction: save, addCommentAction: save, createQuestionAction: save }));
vi.mock("@/features/comments/actions", () => ({ addEntityCommentAction: save }));
vi.mock("@/features/auth/actions", () => ({ loginAction: save, registerAction: save, resetPasswordAction: save }));
import { ProblemForm } from "../features/problems/problem-form";
import { CommunityForm } from "../features/communities/community-form";
import { SolutionForm } from "../features/solutions/solution-form";
import { ClaimForm, ClaimReviewForm, LicenseReviewForm } from "../features/solutions/claim-forms";
import { TeamInviteForm, TeamResponseForm, TeamRemoveForm } from "../features/solutions/team-forms";
import { ProjectForm } from "../features/projects/project-form";
import { EventForm } from "../features/events/event-form";
import { CompensationForm } from "../features/compensation/compensation-form";
import { ReportForm } from "../features/admin/report-form";
import { CommentForm } from "../features/forum/comment-form";
import { EntityCommentForm } from "../features/comments/comment-form";
import { LoginForm } from "../features/auth/login-form";
import { ResetPasswordForm } from "../features/auth/reset-password-form";

afterEach(() => { cleanup(); vi.clearAllMocks(); });
const cases: [string, () => ReactElement][] = [
  ["problem", () => createElement(ProblemForm, {})],
  ["community", () => createElement(CommunityForm)],
  ["solution", () => createElement(SolutionForm)],
  ["solution claim", () => createElement(ClaimForm, { solutionId: "solution" })],
  ["solution claim review", () => createElement(ClaimReviewForm, { id: "claim", revision: 1, self: false })],
  ["solution license review", () => createElement(LicenseReviewForm, { id: "solution", revision: 1 })],
  ["solution invitation", () => createElement(TeamInviteForm, { solutionId: "solution" })],
  ["solution invitation response", () => createElement(TeamResponseForm, { id: "invite" })],
  ["solution access removal", () => createElement(TeamRemoveForm, { solutionId: "solution", userId: "member", self: true })],
  ["project", () => createElement(ProjectForm, { problems: [], solutions: [], communities: [] })],
  ["event", () => createElement(EventForm, { communities: [], discordConfigured: false })],
  ["compensation", () => createElement(CompensationForm)],
  ["report", () => createElement(ReportForm, { targetType: "PROJECT", targetId: "p" })],
  ["forum comment", () => createElement(CommentForm, { targetType: "QUESTION", targetId: "q", slug: "question" })],
  ["entity comment", () => createElement(EntityCommentForm, { targetType: "PROJECT", targetId: "p", returnPath: "/projects/p" })],
  ["login", () => createElement(LoginForm)],
  ["reset password", () => createElement(ResetPasswordForm, { token: "dummy-local-token" })],
];

it.each(cases)("keeps %s inputs after a server refusal", async (_, component) => {
  save.mockResolvedValue({ error: "Erreur de validation de recette." });
  const view = render(component());
  const form = view.container.querySelector("form")!;
  const expected: { element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement; value: string; checked?: boolean }[] = [];
  for (const element of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input,textarea,select")) {
    if (element.type === "hidden" || element.type === "file" || element.type === "submit") continue;
    if (element instanceof HTMLSelectElement) {
      const option = Array.from(element.options).find(o => o.value && !o.disabled);
      if (option) fireEvent.change(element, { target: { value: option.value } });
    } else if (element.type === "checkbox" || element.type === "radio") fireEvent.click(element);
    else fireEvent.change(element, { target: { value: element.type === "number" ? "3" : element.type === "datetime-local" ? "2026-12-01T10:30" : "Saisie de recette conservée" } });
    expected.push({ element, value: element.value, checked: element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type) ? element.checked : undefined });
  }
  fireEvent.submit(form);
  await waitFor(() => expect(view.getByText("Erreur de validation de recette.")).toBeTruthy());
  expect(save).toHaveBeenCalledOnce();
  expect(expected.length).toBeGreaterThan(0);
  for (const { element, value, checked } of expected) {
    expect(element.value).toBe(value);
    if (checked !== undefined) expect((element as HTMLInputElement).checked).toBe(checked);
  }
});
