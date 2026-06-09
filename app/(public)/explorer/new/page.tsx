import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { ProblemForm } from "@/features/problems/problem-form";

export const metadata = { title: "Proposer un problème" };

/** Proposition de problème — réservé aux utilisateurs connectés (Sprint 3). */
export default async function NewProblemPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        Proposer un problème
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Décrivez un problème concret du continent. La communauté pourra y
        rattacher ressources et solutions.
      </p>
      <div className="mt-8">
        <ProblemForm />
      </div>
    </div>
  );
}
