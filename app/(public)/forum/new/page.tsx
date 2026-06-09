import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { QuestionForm } from "@/features/forum/question-form";

export const metadata = { title: "Poser une question" };

/** Poser une question — réservé aux utilisateurs connectés (Sprint 5). */
export default async function NewQuestionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Poser une question</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Soyez précis : un bon titre et un contexte clair attirent de meilleures
        réponses.
      </p>
      <div className="mt-8">
        <QuestionForm />
      </div>
    </div>
  );
}
