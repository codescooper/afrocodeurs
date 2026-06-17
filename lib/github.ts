import "server-only";

import { captureException } from "@/lib/observability";

/**
 * Client GitHub minimal (REST v3) basé sur `fetch` natif — aucune dépendance.
 * Lecture seule des issues et milestones d'un dépôt public. GitHub est la
 * source de vérité des tâches de roadmap (cf. plan « Roadmaps de projets »).
 *
 * Sans `GITHUB_TOKEN` : ~60 requêtes/h/IP (dépôts publics). Avec token : 5000/h.
 */

const API = "https://api.github.com";

/** Issue GitHub normalisée (les Pull Requests sont exclues en amont). */
export type GitHubIssue = {
  number: number;
  title: string;
  url: string;
  state: "open" | "closed";
  labels: string[];
  assignees: string[];
  milestoneNumber: number | null;
  updatedAt: string;
};

/** Milestone GitHub normalisé (= « phase » de la roadmap). */
export type GitHubMilestone = {
  number: number;
  title: string;
  description: string | null;
  state: "open" | "closed";
  dueOn: string | null;
};

/** Format `org/repo` attendu pour `Project.githubRepo`. */
export const GITHUB_REPO_REGEX = /^[\w.-]+\/[\w.-]+$/;

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "afrocodeurs-roadmap",
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

/**
 * Pagine un endpoint GitHub jusqu'à épuisement (cap de sécurité à 10 pages =
 * 1000 éléments). Best-effort : toute erreur renvoie ce qui a déjà été collecté.
 */
async function paginate<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= 10; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${API}${path}${sep}per_page=100&page=${page}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!res.ok) {
      captureException(new Error(`GitHub ${res.status} sur ${path}`), {
        scope: "github",
        status: res.status,
      });
      break;
    }
    const batch = (await res.json()) as T[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

type RawIssue = {
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  pull_request?: unknown;
  labels?: ({ name?: string } | string)[];
  assignees?: { login: string }[];
  milestone?: { number: number } | null;
  updated_at: string;
};

/**
 * Issues d'un dépôt (`org/repo`), tous états confondus, Pull Requests exclues.
 * Retourne `[]` en cas d'erreur (jamais de throw — ne casse pas le cron).
 */
export async function fetchRepoIssues(repo: string): Promise<GitHubIssue[]> {
  if (!GITHUB_REPO_REGEX.test(repo)) return [];
  const raw = await paginate<RawIssue>(`/repos/${repo}/issues?state=all`);
  return raw
    .filter((i) => !i.pull_request) // les PR arrivent aussi sur /issues
    .map((i) => ({
      number: i.number,
      title: i.title,
      url: i.html_url,
      state: i.state,
      labels: (i.labels ?? [])
        .map((l) => (typeof l === "string" ? l : (l.name ?? "")))
        .filter(Boolean),
      assignees: (i.assignees ?? []).map((a) => a.login),
      milestoneNumber: i.milestone?.number ?? null,
      updatedAt: i.updated_at,
    }));
}

type RawMilestone = {
  number: number;
  title: string;
  description: string | null;
  state: "open" | "closed";
  due_on: string | null;
};

/** Milestones d'un dépôt (`org/repo`). Retourne `[]` en cas d'erreur. */
export async function fetchRepoMilestones(
  repo: string,
): Promise<GitHubMilestone[]> {
  if (!GITHUB_REPO_REGEX.test(repo)) return [];
  const raw = await paginate<RawMilestone>(`/repos/${repo}/milestones?state=all`);
  return raw.map((m) => ({
    number: m.number,
    title: m.title,
    description: m.description,
    state: m.state,
    dueOn: m.due_on,
  }));
}
