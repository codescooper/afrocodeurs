import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { SolutionForm } from "@/features/solutions/solution-form";

export const metadata = { title: "Ajouter une solution" };

/** Ajout d'une solution — réservé aux utilisateurs connectés (Sprint 6). */
export default async function NewSolutionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        Ajouter une solution
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Référencez un logiciel, une API, une startup ou une organisation utile
        au continent.
      </p>
      <div className="mt-8">
        <SolutionForm />
      </div>
    </div>
  );
}
