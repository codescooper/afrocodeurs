import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { CommunityForm } from "@/features/communities/community-form";

export const metadata = { title: "Créer une communauté" };

/** Création de communauté — réservé aux utilisateurs connectés (Sprint 2). */
export default async function NewCommunityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        Créer une communauté
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Rassemblez les AfroMakers autour d&apos;un métier, d&apos;un lieu ou
        d&apos;un projet.
      </p>
      <div className="mt-8">
        <CommunityForm />
      </div>
    </div>
  );
}
