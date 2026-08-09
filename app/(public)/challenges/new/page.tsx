import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ChallengeForm } from "@/features/challenges/challenge-form";

export const metadata = { title: "Proposer une énigme" };

export default async function NewChallengePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <div className="mx-auto w-full max-w-3xl px-4 py-12"><h1 className="text-3xl font-bold tracking-tight">Concevoir une énigme</h1><p className="mt-2 text-muted-foreground">Créez une expérience amusante, claire et éducative. La réponse et l’explication resteront secrètes jusqu’à la résolution.</p><div className="mt-8"><ChallengeForm /></div></div>;
}
