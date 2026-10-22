import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberSelect } from "@/features/mentorship/queries";
import { MentorshipForm } from "@/features/mentorship/action-form";
import { canTransition, STATUS_LABELS } from "@/features/mentorship/validators";
import { ReportForm } from "@/features/admin/report-form";
import { startDirectConversationAction } from "@/features/messaging/actions";
import { Button } from "@/components/ui/button";
import { VerifyEmailBanner } from "@/features/auth/verify-email-banner";
import { redirect } from "next/navigation";

const input = "rounded-md border border-border bg-background p-2 text-sm";
export default async function MyMentorshipPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.min(1000, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const session = await auth();
  if (!session?.user) redirect("/login");
  const id = session.user.id;
  const [offer, requests, blocks] = await Promise.all([
    db.mentorshipOffer.findUnique({ where: { mentorId: id } }),
    db.mentorshipRequest.findMany({ where: { OR: [{ menteeId: id }, { offer: { mentorId: id } }] }, orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * 20, take: 21, include: { mentee: { select: memberSelect }, offer: { include: { mentor: { select: memberSelect } } } } }),
    db.mentorshipBlock.findMany({ where: { blockerId: id }, include: { blocked: { select: memberSelect } } }),
  ]);
  return <div className="max-w-4xl space-y-10 break-words"><div className="flex flex-wrap justify-between gap-4"><h1 className="text-2xl font-bold">Mon mentorat</h1><Link href="/mentorship" className="underline">Trouver un mentor</Link></div>
    {!session.user.isEmailVerified && <VerifyEmailBanner />}
    <details className="space-y-4"><summary className="cursor-pointer text-lg font-semibold">{offer ? "Modifier mon offre de mentor" : "Proposer mon aide comme mentor"}</summary>
      {offer?.suspendedAt && <p role="alert" className="text-destructive">Offre retirée par la modération. Les modifications ne la republieront pas.</p>}
      <MentorshipForm fields={{ command: "offer" }} label={offer ? "Enregistrer mon offre" : "Proposer mon aide"}>
        <label className="flex flex-col gap-1 text-sm">Titre<input className={input} name="title" required minLength={5} maxLength={100} defaultValue={offer?.title} /></label>
        <label className="flex flex-col gap-1 text-sm">Ce que je peux accompagner<textarea className={input} name="description" required minLength={40} maxLength={2000} rows={4} defaultValue={offer?.description} /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="flex flex-col gap-1 text-sm">Sujets (séparés par des virgules)<input className={input} name="topics" required maxLength={240} defaultValue={offer?.topics.join(", ")} /></label><label className="flex flex-col gap-1 text-sm">Langues (séparées par des virgules)<input className={input} name="languages" required maxLength={240} defaultValue={offer?.languages.join(", ")} /></label></div>
        <label className="flex flex-col gap-1 text-sm">Créneaux et fuseau horaire<input className={input} name="availability" required minLength={5} maxLength={160} defaultValue={offer?.availability} /></label>
        <label className="flex flex-col gap-1 text-sm">Nombre de suivis simultanés<input className={`${input} w-24`} name="capacity" type="number" min={1} max={5} required defaultValue={offer?.capacity ?? 2} /></label>
        <label className="flex items-center gap-2 text-sm"><input name="active" type="checkbox" defaultChecked={offer?.active ?? true} />Accepter de nouvelles demandes</label>
      </MentorshipForm>
    </details>
    <section className="space-y-4"><h2 className="text-lg font-semibold">Demandes et suivis</h2>{!requests.length && <p className="text-sm text-muted-foreground">Aucune demande pour le moment.</p>}
      <div className="divide-y divide-border">{requests.slice(0, 20).map((r) => {
        const isMentor = r.offer.mentorId === id;
        const other = isMentor ? r.mentee : r.offer.mentor;
        return <article key={r.id} className="space-y-3 py-5"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{isMentor ? "Demande de" : "Demande à"} <Link className="underline" href={`/u/${other.username}`}>@{other.username}</Link></h3><span className="text-sm text-muted-foreground">{STATUS_LABELS[r.status]}</span></div><p className="text-sm">{r.offer.title}</p><p className="whitespace-pre-wrap text-sm">{r.message}</p>
          <div className="flex flex-wrap items-start gap-3">{(["ACCEPTED", "DECLINED", "COMPLETED", "CANCELLED"] as const).filter((status) => canTransition(r.status, status, isMentor)).map((status) => <MentorshipForm key={status} fields={{ command: "respond", id: r.id, status }} label={{ ACCEPTED: "Accepter", DECLINED: "Refuser", COMPLETED: "Terminer", CANCELLED: "Annuler le suivi" }[status]} />)}
          {r.status === "ACCEPTED" && <form action={startDirectConversationAction}><input name="recipientId" value={other.id} type="hidden" /><Button type="submit" variant="outline">Discuter</Button></form>}</div>
          <div className="flex flex-wrap items-start gap-4"><ReportForm targetType={isMentor ? "MENTORSHIP_REQUEST" : "MENTORSHIP_OFFER"} targetId={isMentor ? r.id : r.offerId} /><MentorshipForm fields={{ command: "block", id: other.id }} label="Bloquer le mentorat avec ce membre" /></div>
        </article>;
      })}</div>
      <nav aria-label="Pages des demandes" className="flex gap-6">{page > 1 && <Link href={`/dashboard/mentorship?page=${page - 1}`}>Précédente</Link>}{requests.length > 20 && <Link href={`/dashboard/mentorship?page=${page + 1}`}>Suivante</Link>}</nav>
    </section>
    {blocks.length > 0 && <section className="space-y-4"><h2 className="text-lg font-semibold">Membres bloqués pour le mentorat</h2>{blocks.map((block) => <div key={block.id} className="flex flex-wrap items-start gap-4"><span>@{block.blocked.username}</span><MentorshipForm fields={{ command: "unblock", id: block.blockedId }} label="Débloquer le mentorat" /></div>)}</section>}
  </div>;
}
