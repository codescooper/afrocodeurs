import "server-only";

import { db } from "@/lib/db";
import { fetchRepoIssues, fetchRepoMilestones } from "@/lib/github";
import { captureException } from "@/lib/observability";
import { award } from "@/features/reputation/award";

/** Un label marque-t-il une « bonne première tâche » ? */
function isGoodFirst(labels: string[]): boolean {
  return labels.some((l) => {
    const n = l.toLowerCase();
    return n === "good first issue" || n === "help wanted";
  });
}

/**
 * Synchronise un projet avec son dépôt GitHub : milestones (phases) et issues
 * (tâches), en upsert. Met à jour état/labels/assignees/milestone, puis attribue
 * la réputation aux AfroMakers dont une tâche assignée est terminée (idempotent
 * via `completionAwarded`). Best-effort : ne lève jamais (ne casse pas le cron).
 */
export async function syncProject(projectId: string): Promise<void> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, githubRepo: true },
  });
  if (!project) return;

  try {
    const [issues, milestones] = await Promise.all([
      fetchRepoIssues(project.githubRepo),
      fetchRepoMilestones(project.githubRepo),
    ]);

    // 1) Milestones → on construit la table de correspondance numéro → id.
    const milestoneIdByNumber = new Map<number, string>();
    const ordered = [...milestones].sort((a, b) => a.number - b.number);
    for (let i = 0; i < ordered.length; i++) {
      const m = ordered[i];
      const row = await db.roadmapMilestone.upsert({
        where: { projectId_githubId: { projectId, githubId: m.number } },
        create: {
          projectId,
          githubId: m.number,
          title: m.title,
          description: m.description,
          state: m.state,
          dueOn: m.dueOn ? new Date(m.dueOn) : null,
          ordinal: i,
        },
        update: {
          title: m.title,
          description: m.description,
          state: m.state,
          dueOn: m.dueOn ? new Date(m.dueOn) : null,
          ordinal: i,
        },
        select: { id: true },
      });
      milestoneIdByNumber.set(m.number, row.id);
    }

    // 2) Issues → tâches.
    for (const issue of issues) {
      const milestoneId =
        issue.milestoneNumber != null
          ? (milestoneIdByNumber.get(issue.milestoneNumber) ?? null)
          : null;
      const state = issue.state === "closed" ? "CLOSED" : "OPEN";
      await db.roadmapTask.upsert({
        where: {
          projectId_githubNumber: { projectId, githubNumber: issue.number },
        },
        create: {
          projectId,
          githubNumber: issue.number,
          title: issue.title,
          url: issue.url,
          state,
          labels: issue.labels,
          assignees: issue.assignees,
          isGoodFirst: isGoodFirst(issue.labels),
          githubUpdatedAt: new Date(issue.updatedAt),
          milestoneId,
        },
        update: {
          title: issue.title,
          url: issue.url,
          state,
          labels: issue.labels,
          assignees: issue.assignees,
          isGoodFirst: isGoodFirst(issue.labels),
          githubUpdatedAt: new Date(issue.updatedAt),
          milestoneId,
        },
      });
    }

    await db.project.update({
      where: { id: projectId },
      data: { lastSyncedAt: new Date() },
    });

    await awardCompletedTasks(projectId);
  } catch (error) {
    captureException(error, { scope: "syncProject", projectId });
  }
}

/**
 * Attribue la réputation « tâche terminée » : pour chaque tâche CLOSED non
 * encore créditée, on mappe les assignees (logins GitHub) vers les AfroMakers
 * via `Profile.githubLogin`, puis on attribue les points une seule fois.
 */
async function awardCompletedTasks(projectId: string): Promise<void> {
  const tasks = await db.roadmapTask.findMany({
    where: { projectId, state: "CLOSED", completionAwarded: false },
    select: { id: true, assignees: true },
  });
  if (tasks.length === 0) return;

  const logins = [...new Set(tasks.flatMap((t) => t.assignees))];
  const profiles = logins.length
    ? await db.profile.findMany({
        where: { githubLogin: { in: logins } },
        select: { userId: true, githubLogin: true },
      })
    : [];
  const userByLogin = new Map(
    profiles.map((p) => [p.githubLogin as string, p.userId]),
  );

  for (const task of tasks) {
    for (const login of task.assignees) {
      const userId = userByLogin.get(login);
      if (userId) {
        await award(userId, "TASK_COMPLETED", { type: "PROJECT", id: projectId });
      }
    }
    await db.roadmapTask.update({
      where: { id: task.id },
      data: { completionAwarded: true },
    });
  }
}

/** Synchronise tous les projets (déclenché par le cron). Renvoie le compte traité. */
export async function syncAllProjects(): Promise<number> {
  const projects = await db.project.findMany({
    select: { id: true },
    take: 1000,
  });
  for (const p of projects) {
    await syncProject(p.id);
  }
  return projects.length;
}
