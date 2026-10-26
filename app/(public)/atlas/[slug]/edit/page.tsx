import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SolutionForm } from "@/features/solutions/solution-form";

export const metadata = { title: "Gérer une solution", robots: { index: false, follow: false } };

export default async function EditSolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = (await auth())?.user;
  if (!user) redirect("/login");
  const { slug } = await params;
  const solution = await db.solution.findUnique({ where: { slug } });
  if (!solution) notFound();
  const member = await db.solutionMaintainer.findUnique({ where: { solutionId_userId: { solutionId: solution.id, userId: user.id } } });
  if (!member && user.role !== "ADMIN") notFound();
  return <main className="mx-auto max-w-4xl px-4 py-12"><h1 className="mb-6 text-2xl font-semibold">Gérer {solution.name}</h1><SolutionForm solution={solution} /></main>;
}
