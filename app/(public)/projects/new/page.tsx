import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { ProjectForm } from "@/features/projects/project-form";

export const metadata = { title: "Référencer un projet" };

export const dynamic = "force-dynamic";

/** Référencement d'un projet — réservé aux contributeurs (email vérifié). */
export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session.user.role, "project:create")) redirect("/projects");

  const [problems, communities] = await Promise.all([
    db.problem.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
      take: 200,
    }),
    db.community.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
      take: 200,
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Référencer un projet</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Branchez un projet open source sur son dépôt GitHub. Sa roadmap (tâches,
        phases, contributeurs) sera synchronisée automatiquement — pour
        contribuer, il suffit d&apos;un compte GitHub et de s&apos;assigner une
        issue.
      </p>
      <div className="mt-8">
        <ProjectForm problems={problems} communities={communities} />
      </div>
    </div>
  );
}
