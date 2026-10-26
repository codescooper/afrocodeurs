import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TeamResponseForm } from "@/features/solutions/team-forms";

export const metadata = { title: "Mes solutions Atlas" };

export default async function MyAtlasPage() {
  const user = (await auth())?.user;
  if (!user) redirect("/login");
  const [memberships, invitations, claims] = await Promise.all([
    db.solutionMaintainer.findMany({ where: { userId: user.id }, include: { solution: { select: { name: true, slug: true } } }, take: 100, orderBy: { createdAt: "desc" } }),
    db.solutionInvitation.findMany({ where: { recipientId: user.id, status: "PENDING", expiresAt: { gt: new Date() } }, include: { solution: { select: { name: true, slug: true } }, sender: { select: { username: true } } }, take: 100, orderBy: { createdAt: "desc" } }),
    db.solutionClaim.findMany({ where: { userId: user.id }, include: { solution: { select: { name: true, slug: true } } }, take: 100, orderBy: { updatedAt: "desc" } }),
  ]);
  return <main className="space-y-10"><h1 className="text-2xl font-semibold">Mes solutions Atlas</h1><section><h2 className="text-xl font-semibold">Fiches que je gère</h2>{!memberships.length && <p className="mt-3 text-sm">Vous ne gérez pas encore de fiche.</p>}<ul className="mt-4 space-y-3">{memberships.map(member => <li key={member.solutionId}><Link href={`/atlas/${member.solution.slug}/edit`} className="underline">{member.solution.name}</Link></li>)}</ul></section><section><h2 className="text-xl font-semibold">Invitations reçues</h2>{!invitations.length && <p className="mt-3 text-sm">Aucune invitation en attente.</p>}<div className="divide-y divide-border">{invitations.map(invite => <article key={invite.id} className="space-y-3 py-5"><h3 className="font-medium"><Link href={`/atlas/${invite.solution.slug}`} className="underline">{invite.solution.name}</Link></h3><p className="text-sm">@{invite.sender.username} propose {invite.kind === "TRANSFER" ? "de vous transférer son accès" : "de rejoindre la gestion"}. Expiration : {invite.expiresAt.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}.</p><TeamResponseForm id={invite.id} /></article>)}</div></section><section><h2 className="text-xl font-semibold">Mes demandes de vérification</h2><ul className="mt-4 space-y-3">{claims.map(claim => <li key={claim.id}><Link href={`/atlas/${claim.solution.slug}`} className="underline">{claim.solution.name}</Link> · {claim.status === "PENDING" ? "En attente" : claim.status === "APPROVED" ? "Approuvée" : "Refusée"}{claim.reviewNote && <p className="mt-1 whitespace-pre-wrap text-sm">{claim.reviewNote}</p>}</li>)}</ul></section><Link href="/atlas" className="inline-block underline">Explorer le catalogue</Link></main>;
}
