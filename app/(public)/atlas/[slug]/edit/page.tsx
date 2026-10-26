import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SolutionForm } from "@/features/solutions/solution-form";
import Link from "next/link";
import { TeamInviteForm, TeamRemoveForm, TeamResponseForm } from "@/features/solutions/team-forms";

export const metadata = { title: "Gérer une solution", robots: { index: false, follow: false } };

export default async function EditSolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = (await auth())?.user;
  if (!user) redirect("/login");
  const { slug } = await params;
  const solution = await db.solution.findUnique({ where: { slug } });
  if (!solution) notFound();
  const member = await db.solutionMaintainer.findUnique({ where: { solutionId_userId: { solutionId: solution.id, userId: user.id } } });
  if (!member && user.role !== "ADMIN") notFound();
  const [members, invitations] = await Promise.all([
    db.solutionMaintainer.findMany({ where: { solutionId: solution.id }, include: { user: { select: { username: true, name: true } } } }),
    db.solutionInvitation.findMany({ where: { solutionId: solution.id, status: "PENDING", expiresAt: { gt: new Date() }, ...(user.role === "ADMIN" ? {} : { senderId: user.id }) }, include: { recipient: { select: { username: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return <main className="mx-auto max-w-4xl px-4 py-12"><Link href="/dashboard/atlas" className="text-sm underline">Mes solutions et invitations</Link><h1 className="my-6 text-2xl font-semibold">Gérer {solution.name}</h1><SolutionForm solution={solution} /><section className="mt-12 border-t border-border pt-8"><h2 className="mb-5 text-xl font-semibold">Équipe de gestion</h2><ul className="divide-y divide-border">{members.map(manager => <li key={manager.userId} className="py-4"><p className="font-medium">{manager.user.name ?? `@${manager.user.username}`}</p>{(manager.userId === user.id || user.role === "ADMIN") && <details className="mt-3"><summary className="cursor-pointer text-sm">{manager.userId === user.id ? "Quitter cette équipe" : "Retirer cet accès"}</summary><div className="mt-3"><TeamRemoveForm solutionId={solution.id} userId={manager.userId} self={manager.userId === user.id} /></div></details>}</li>)}</ul><h3 className="my-5 font-semibold">Inviter un membre ou transmettre mon accès</h3><TeamInviteForm solutionId={solution.id} /></section><section className="mt-10 border-t border-border pt-8"><h2 className="text-xl font-semibold">Invitations envoyées</h2>{!invitations.length && <p className="mt-3 text-sm">Aucune invitation en attente.</p>}{invitations.map(invite => <div key={invite.id} className="space-y-3 border-b border-border py-4"><p>@{invite.recipient.username} · {invite.kind === "TRANSFER" ? "Transfert" : "Co-gestion"}</p><TeamResponseForm id={invite.id} cancel /></div>)}</section></main>;
}
