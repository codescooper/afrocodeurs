import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { checkGithubProof, githubRepository } from "../features/solutions/github-proof";

it.each(["http://github.com/team/project", "https://github.com.evil.test/team/project", "https://user:token@github.com/team/project", "https://github.com/team/project/tree/main", "https://127.0.0.1/team/project", "https://github.com/team/project?url=internal"])("rejects untrusted repository %s", value => {
  expect(githubRepository(value)).toBeNull();
});
it("checks only a fixed GitHub API endpoint and the exact personal marker", async () => {
  const fetcher = vi.fn(async () => new Response("afrocodeurs:claim:user\n"));
  expect(await checkGithubProof("https://github.com/team/project.git", "claim", "user", fetcher)).toBe("team/project");
  expect(fetcher).toHaveBeenCalledWith("https://api.github.com/repos/team/project/contents/.afrocodeurs/claims/claim.txt", expect.objectContaining({ redirect: "error", cache: "no-store" }));
});
it("rejects another member's marker", async () => {
  await expect(checkGithubProof("https://github.com/team/project", "claim", "user", async () => new Response("afrocodeurs:claim:someone-else"))).rejects.toThrow("correspond pas");
});
it("rejects oversized proofs and GitHub errors", async () => {
  await expect(checkGithubProof("https://github.com/team/project", "claim", "user", async () => new Response("x".repeat(5000)))).rejects.toThrow("uniquement");
  await expect(checkGithubProof("https://github.com/team/project", "claim", "user", async () => new Response(null, { status: 404 }))).rejects.toThrow("introuvable");
});
