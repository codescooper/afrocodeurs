import "server-only";

import type { TaskState } from "@prisma/client";

import { db } from "@/lib/db";
import { deriveTaskStatus, isIndependent, type DerivedStatus } from "./roadmap";

export type RoadmapTaskView = {
  id: string;
  githubNumber: number;
  title: string;
  url: string;
  assignees: string[];
  isGoodFirst: boolean;
  derived: DerivedStatus;
  independent: boolean;
  prerequisites: { id: string; githubNumber: number; title: string }[];
};

export type RoadmapPhase = {
  id: string; // id du milestone, ou "none" pour le hors-phase
  title: string;
  state: string;
  ordinal: number;
  tasks: RoadmapTaskView[];
};

/**
 * Charge la roadmap d'un projet : tâches (issues GitHub en cache) regroupées par
 * phase (milestone), avec statut dérivé et prérequis. Mirror de
 * `getProblemRelations` (features/relations/queries.ts).
 */
export async function getProjectRoadmap(
  projectId: string,
): Promise<RoadmapPhase[]> {
  const [milestones, tasks] = await Promise.all([
    db.roadmapMilestone.findMany({
      where: { projectId },
      orderBy: { ordinal: "asc" },
      select: { id: true, title: true, state: true, ordinal: true },
    }),
    db.roadmapTask.findMany({
      where: { projectId },
      orderBy: { githubNumber: "asc" },
      select: {
        id: true,
        githubNumber: true,
        title: true,
        url: true,
        state: true,
        assignees: true,
        isGoodFirst: true,
        milestoneId: true,
        dependencies: {
          select: {
            dependsOn: {
              select: { id: true, githubNumber: true, title: true, state: true },
            },
          },
        },
        _count: { select: { dependents: true } },
      },
    }),
  ]);

  const views: (RoadmapTaskView & { milestoneId: string | null })[] = tasks.map(
    (t) => {
      const prereqStates: TaskState[] = t.dependencies.map(
        (d) => d.dependsOn.state,
      );
      return {
        id: t.id,
        githubNumber: t.githubNumber,
        title: t.title,
        url: t.url,
        assignees: t.assignees,
        isGoodFirst: t.isGoodFirst,
        derived: deriveTaskStatus(t, prereqStates),
        independent: isIndependent(t.dependencies.length, t._count.dependents),
        prerequisites: t.dependencies.map((d) => ({
          id: d.dependsOn.id,
          githubNumber: d.dependsOn.githubNumber,
          title: d.dependsOn.title,
        })),
        milestoneId: t.milestoneId,
      };
    },
  );

  const phases: RoadmapPhase[] = milestones.map((m) => ({
    id: m.id,
    title: m.title,
    state: m.state,
    ordinal: m.ordinal,
    tasks: views.filter((v) => v.milestoneId === m.id),
  }));

  const orphans = views.filter((v) => v.milestoneId === null);
  if (orphans.length > 0) {
    phases.push({
      id: "none",
      title: "Hors phase",
      state: "open",
      ordinal: milestones.length,
      tasks: orphans,
    });
  }

  return phases;
}

/** Tâches d'un projet liables comme prérequis (pour le formulaire de dépendance). */
export async function getProjectTasks(projectId: string) {
  return db.roadmapTask.findMany({
    where: { projectId },
    orderBy: { githubNumber: "asc" },
    select: { id: true, githubNumber: true, title: true },
  });
}

/** Arêtes de dépendance existantes d'un projet (pour affichage/retrait). */
export async function getProjectDependencies(projectId: string) {
  return db.roadmapDependency.findMany({
    where: { task: { projectId } },
    select: {
      id: true,
      task: { select: { githubNumber: true, title: true } },
      dependsOn: { select: { githubNumber: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
