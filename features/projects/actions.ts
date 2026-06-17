"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { orNull, uniqueSlug } from "@/lib/utils";
import { guard, invalidMessage } from "@/lib/guard";
import { hasRank } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { dependencySchema, projectSchema } from "@/lib/validators";
import { award } from "@/features/reputation/award";
import { syncProject } from "./sync";

export type ProjectFormState = { error?: string } | undefined;
export type DependencyFormState =
  | { error?: string; success?: boolean }
  | undefined;

/** Référencer un projet OSS et brancher sa roadmap sur un dépôt GitHub. */
export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const g = await guard({ permission: "project:create", verified: true });
  if (!g.ok) return { error: g.error };

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    githubRepo: formData.get("githubRepo"),
    websiteUrl: formData.get("websiteUrl") || "",
    status: formData.get("status") || "IDEA",
    problemId: formData.get("problemId") || "",
    communityId: formData.get("communityId") || "",
  });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const d = parsed.data;
  const slug = await uniqueSlug(d.name, "projet", async (s) =>
    Boolean(
      await db.project.findUnique({ where: { slug: s }, select: { id: true } }),
    ),
  );

  const project = await db.project.create({
    data: {
      name: d.name,
      slug,
      description: d.description,
      githubRepo: d.githubRepo,
      websiteUrl: orNull(d.websiteUrl),
      status: d.status,
      problemId: orNull(d.problemId),
      communityId: orNull(d.communityId),
      createdById: g.user.id,
    },
  });
  await award(g.user.id, "PROJECT_CREATED", { type: "PROJECT", id: project.id });

  // Synchro initiale (best-effort — ne bloque pas la création si GitHub échoue).
  await syncProject(project.id);

  revalidatePath("/projects");
  redirect(`/projects/${slug}`);
}

/** Charge un projet et vérifie que l'utilisateur courant peut le gérer. */
async function requireMaintainer(
  projectId: string,
): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const g = await guard();
  if (!g.ok) return { ok: false, error: g.error };
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { createdById: true },
  });
  if (!project) return { ok: false, error: "Projet introuvable." };
  const allowed =
    project.createdById === g.user.id || hasRank(g.user.role, "MODERATOR");
  if (!allowed) return { ok: false, error: "Action non autorisée." };
  return { ok: true, userId: g.user.id };
}

/** Mettre à jour les métadonnées d'un projet (créateur ou MODERATOR+). */
export async function updateProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const projectId = formData.get("projectId");
  if (typeof projectId !== "string") return { error: "Projet introuvable." };

  const m = await requireMaintainer(projectId);
  if (!m.ok) return { error: m.error };

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    githubRepo: formData.get("githubRepo"),
    websiteUrl: formData.get("websiteUrl") || "",
    status: formData.get("status") || "IDEA",
    problemId: formData.get("problemId") || "",
    communityId: formData.get("communityId") || "",
  });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const d = parsed.data;
  const project = await db.project.update({
    where: { id: projectId },
    data: {
      name: d.name,
      description: d.description,
      githubRepo: d.githubRepo,
      websiteUrl: orNull(d.websiteUrl),
      status: d.status,
      problemId: orNull(d.problemId),
      communityId: orNull(d.communityId),
    },
    select: { slug: true },
  });

  revalidatePath(`/projects/${project.slug}`);
  return undefined;
}

/**
 * Le prérequis `dependsOnId` peut-il atteindre `taskId` en suivant ses propres
 * prérequis ? Si oui, ajouter l'arête `taskId → dependsOnId` créerait un cycle.
 */
async function wouldCreateCycle(
  projectId: string,
  taskId: string,
  dependsOnId: string,
): Promise<boolean> {
  if (taskId === dependsOnId) return true;
  const edges = await db.roadmapDependency.findMany({
    where: { task: { projectId } },
    select: { taskId: true, dependsOnId: true },
  });
  const prereqsOf = new Map<string, string[]>();
  for (const e of edges) {
    const list = prereqsOf.get(e.taskId) ?? [];
    list.push(e.dependsOnId);
    prereqsOf.set(e.taskId, list);
  }
  // BFS depuis dependsOnId : atteint-on taskId via les prérequis existants ?
  const seen = new Set<string>();
  const queue = [dependsOnId];
  while (queue.length) {
    const cur = queue.shift() as string;
    if (cur === taskId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const next of prereqsOf.get(cur) ?? []) queue.push(next);
  }
  return false;
}

/** Ajouter une arête de dépendance « taskId dépend de dependsOnId » (anti-cycle). */
export async function addDependencyAction(
  _prev: DependencyFormState,
  formData: FormData,
): Promise<DependencyFormState> {
  const g = await guard({ permission: "roadmap:edit", verified: true });
  if (!g.ok) return { error: g.error };

  const parsed = dependencySchema.safeParse({
    taskId: formData.get("taskId"),
    dependsOnId: formData.get("dependsOnId"),
  });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const { taskId, dependsOnId } = parsed.data;
  const projectId = formData.get("projectId");
  const slug = formData.get("slug");
  if (typeof projectId !== "string") return { error: "Projet introuvable." };

  // Les deux tâches doivent appartenir au même projet.
  const count = await db.roadmapTask.count({
    where: { projectId, id: { in: [taskId, dependsOnId] } },
  });
  if (count !== 2) return { error: "Tâche invalide." };

  if (await wouldCreateCycle(projectId, taskId, dependsOnId)) {
    return { error: "Dépendance refusée : elle créerait un cycle." };
  }

  await db.roadmapDependency.upsert({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
    update: {},
    create: { taskId, dependsOnId, createdById: g.user.id },
  });

  if (typeof slug === "string") revalidatePath(`/projects/${slug}`);
  return { success: true };
}

/** Retirer une arête de dépendance (créateur du projet ou MODERATOR+). */
export async function removeDependencyAction(formData: FormData): Promise<void> {
  const g = await guard({ permission: "roadmap:edit" });
  if (!g.ok) return;

  const dependencyId = formData.get("dependencyId");
  const slug = formData.get("slug");
  if (typeof dependencyId !== "string") return;

  const dep = await db.roadmapDependency.findUnique({
    where: { id: dependencyId },
    select: { task: { select: { projectId: true } } },
  });
  if (!dep) return;
  const m = await requireMaintainer(dep.task.projectId);
  if (!m.ok) return;

  await db.roadmapDependency.delete({ where: { id: dependencyId } });
  if (typeof slug === "string") revalidatePath(`/projects/${slug}`);
}

/** Resynchroniser un projet avec GitHub (créateur ou MODERATOR+, rate-limité). */
export async function refreshProjectAction(formData: FormData): Promise<void> {
  const projectId = formData.get("projectId");
  const slug = formData.get("slug");
  if (typeof projectId !== "string") return;

  const m = await requireMaintainer(projectId);
  if (!m.ok) return;
  if (!rateLimit(`roadmap-refresh:${m.userId}`, 5, 60 * 1000).ok) return;

  await syncProject(projectId);
  if (typeof slug === "string") revalidatePath(`/projects/${slug}`);
}
