import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { publicMember } from "@/features/constellation/queries";
import { VentureActionForm } from "@/features/constellation/action-form";
import { VENTURE_STATUS, COLLAB_STATUS } from "@/features/constellation/constants";
import { startDirectConversationAction } from "@/features/messaging/actions";
import { Button } from "@/components/ui/button";
import { ReportForm } from "@/features/admin/report-form";
export const metadata = { title: "Mes réalisations et collaborations" };
export default async function VentureDashboard({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth(); if (!session?.user) redirect("/login");
  const id = session.user.id;
  const params = await searchParams;
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const [ventures, collaborations, blocks] = await Promise.all([
    db.communityVenture.findMany({ where: { ownerId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.ventureCollaboration.findMany({ where: { OR: [{ applicantId: id }, { venture: { ownerId: id } }] }, orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * 20, take: 21, include: { applicant: { select: publicMember }, venture: { select: { id: true, name: true, slug: true, ownerId: true, owner: { select: publicMember } } } } }),
    db.ventureBlock.findMany({ where: { blockerId: id }, select: { id: true, blockedId: true, blocked: { select: { username: true } } } }),
  ]);
  return <div className="max-w-4xl space-y-10 break-words"><header className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-bold">Mon espace Constellation</h1><Link className="text-sm underline" href="/constellation">Explorer la Constellation</Link></header>
    <section><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Mes réalisations</h2><Link href="/constellation/new" className="text-sm underline">Présenter une réalisation</Link></div>{!ventures.length && <p className="text-sm text-muted-foreground">Tu as lancé un produit ou un service ? Présente-le à la communauté.</p>}
      <div className="divide-y divide-border">{ventures.map((v) => <article key={v.id} className="space-y-3 py-5"><div className="flex flex-wrap justify-between gap-3"><Link href={`/constellation/${v.slug}`} className="font-semibold underline">{v.name}</Link><span className="text-sm text-muted-foreground">{VENTURE_STATUS[v.status]}</span></div>{v.reviewNote && <p className="text-sm">Retour de modération : {v.reviewNote}</p>}<div className="flex flex-wrap items-start gap-5">{v.status !== "SUSPENDED" && <><a href={`/constellation/new?edit=${v.id}`} className="py-2 text-sm underline">Modifier et soumettre</a>{v.status !== "ARCHIVED" && <VentureActionForm fields={{ id: v.id }} kind="archive" label="Retirer ma fiche" />}</>}</div></article>)}</div>
    </section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Propositions de collaboration</h2>{!collaborations.length && <p className="text-sm text-muted-foreground">Aucune proposition pour le moment.</p>}<div className="divide-y divide-border">{collaborations.slice(0, 20).map((c) => {
      const owner = c.venture.ownerId === id;
      const other = owner ? c.applicant : c.venture.owner;
      return <article key={c.id} className="space-y-3 py-5"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-semibold">{c.venture.name}</h3><span className="text-sm text-muted-foreground">{COLLAB_STATUS[c.status]}</span></div><p className="text-sm">{owner ? "Proposition de" : "Envoyée à"} <Link href={`/u/${other.username}`} className="underline">@{other.username}</Link></p><p className="whitespace-pre-wrap text-sm">{c.message}</p><div className="flex flex-wrap gap-3">{owner && c.status === "PENDING" && <>{(["ACCEPTED", "DECLINED"] as const).map((status) => <VentureActionForm key={status} fields={{ command: "respond", id: c.id, status }} label={status === "ACCEPTED" ? "Accepter" : "Refuser"} />)}</>}{["PENDING", "ACCEPTED"].includes(c.status) && <VentureActionForm fields={{ command: "respond", id: c.id, status: "CANCELLED" }} label="Annuler la proposition" />}{c.status === "ACCEPTED" && <form action={startDirectConversationAction}><input type="hidden" name="recipientId" value={other.id} /><Button type="submit" variant="outline">Discuter</Button></form>}</div><ReportForm targetType={owner ? "VENTURE_COLLABORATION" : "COMMUNITY_VENTURE"} targetId={owner ? c.id : c.ventureId} /><VentureActionForm fields={{ command: "block", id: other.id }} label="Bloquer les collaborations avec ce membre" /></article>;
    })}</div><nav className="flex gap-5 text-sm" aria-label="Pages des propositions">{page > 1 && <Link href={`/dashboard/constellation?page=${page - 1}`}>Précédente</Link>}{collaborations.length > 20 && <Link href={`/dashboard/constellation?page=${page + 1}`}>Suivante</Link>}</nav></section>
    {blocks.length > 0 && <section className="space-y-4"><h2 className="text-lg font-semibold">Collaborations bloquées</h2>{blocks.map((b) => <div className="flex flex-wrap items-start gap-4" key={b.id}><span>@{b.blocked.username}</span><VentureActionForm fields={{ command: "unblock", id: b.blockedId }} label="Débloquer les collaborations" /></div>)}</section>}
  </div>;
}
