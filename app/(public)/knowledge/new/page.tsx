import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { KnowledgeForm } from "@/features/knowledge/knowledge-form";

export const metadata = { title: "Rédiger une ressource" };

/** Rédaction d'une ressource — réservé aux contributeurs (Sprint 4). */
export default async function NewKnowledgePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!can(session.user.role, "knowledge:create")) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold tracking-tight">
          Devenez contributeur
        </h1>
        <p className="mt-2 text-muted-foreground">
          La rédaction de ressources est réservée aux contributeurs. Participez
          à la communauté (réponses, problèmes, votes) pour débloquer ce statut.
        </p>
        <Link
          href="/knowledge"
          className="mt-6 inline-block text-sm font-medium text-foreground underline"
        >
          ← Retour aux ressources
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        Rédiger une ressource
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Markdown First. Enregistrez un brouillon ou soumettez à validation.
      </p>
      <div className="mt-8">
        <KnowledgeForm />
      </div>
    </div>
  );
}
