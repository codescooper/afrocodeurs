import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { KnowledgeForm } from "@/features/knowledge/knowledge-form";
import { postingCommunityBySlug } from "@/features/communities/posting";

export const metadata = { title: "Partager une ressource" };

/** Proposition d'une ressource par un membre de la communauté. */
export default async function NewKnowledgePage({ searchParams }: { searchParams: Promise<{ community?: string; type?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!can(session.user.role, "knowledge:create")) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold tracking-tight">Accès indisponible</h1>
        <p className="mt-2 text-muted-foreground">
          Connectez-vous avec un compte membre pour proposer une ressource.
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
  const query = await searchParams;
  const community = await postingCommunityBySlug(session.user.id, query.community);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        Partager une ressource
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Partagez un cours, une astuce, une vidéo, un outil ou un guide utile.
        Vous pouvez enregistrer un brouillon avant de le soumettre à la modération.
      </p>
      <div className="mt-8">
        <KnowledgeForm community={community} defaultType={query.type === "LINK" ? "LINK" : "ARTICLE"} />
      </div>
    </div>
  );
}
