import "server-only";
import { claimProofCode } from "./catalog";
import { SolutionAccessError } from "./claim-service";

export function githubRepository(value: string | null) {
  try {
    const url = new URL(value ?? "");
    if (url.protocol !== "https:" || url.hostname !== "github.com" || url.port || url.username || url.password || url.search || url.hash) return null;
    const match = url.pathname.match(/^\/([\w-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
    if (!match || match[2] === "." || match[2] === "..") return null;
    return `${match[1]}/${match[2]}`;
  } catch { return null; }
}

export function githubProofPath(id: string) { return `.afrocodeurs/claims/${id}.txt`; }

export async function checkGithubProof(repositoryUrl: string | null, claimId: string, userId: string, fetcher: typeof fetch = fetch) {
  const repository = githubRepository(repositoryUrl);
  if (!repository || !/^[a-zA-Z0-9_-]{1,100}$/.test(claimId)) throw new SolutionAccessError("Indiquez un dépôt public github.com valide ou utilisez la vérification manuelle.");
  const response = await fetcher(`https://api.github.com/repos/${repository}/contents/${githubProofPath(claimId)}`, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10000), headers: { Accept: "application/vnd.github.raw+json", "User-Agent": "AfroCodeurs-Claim-Verification", "X-GitHub-Api-Version": "2022-11-28" } });
  if (!response.ok) throw new SolutionAccessError("Code introuvable ou GitHub indisponible. Vérifiez le fichier sur la branche par défaut ou demandez une vérification manuelle.");
  const reader = response.body?.getReader();
  if (!reader) throw new SolutionAccessError("La preuve GitHub est vide.");
  let body = "", size = 0;
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) throw new SolutionAccessError("Le fichier de preuve doit contenir uniquement le code personnel.");
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } finally { await reader.cancel(); }
  if (body.trim() !== claimProofCode(claimId, userId)) throw new SolutionAccessError("Le code ne correspond pas à votre demande.");
  return repository;
}
