import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar } from "@/components/shared/avatar";
import { blockedMentorshipIds, memberSelect } from "@/features/mentorship/queries";
import { MentorshipForm } from "@/features/mentorship/action-form";
import { ReportForm } from "@/features/admin/report-form";

export default async function MentorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const blocked = await blockedMentorshipIds(session?.user?.id);
  const offer = await db.mentorshipOffer.findFirst({ where: { id, active: true, suspendedAt: null, mentorId: { notIn: blocked }, mentor: { emailVerified: { not: null } } }, include: { mentor: { select: memberSelect }, _count: { select: { requests: { where: { status: "ACCEPTED" } } } } } });
  if (!offer) notFound();
  const existing = session?.user ? await db.mentorshipRequest.findUnique({ where: { offerId_menteeId: { offerId: offer.id, menteeId: session.user.id } }, select: { id: true } }) : null;
  return <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 break-words">
    <Link href="/mentorship" className="text-sm underline">Tous les mentors</Link>
    <div className="flex items-center gap-3"><Avatar image={offer.mentor.image} name={offer.mentor.name ?? offer.mentor.username} size={48} /><Link href={`/u/${offer.mentor.username}`}>@{offer.mentor.username}</Link></div>
    <h1 className="text-3xl font-bold">{offer.title}</h1><p className="whitespace-pre-wrap">{offer.description}</p>
    <dl className="grid gap-3 border-y border-border py-4 text-sm"><div><dt className="font-semibold">Sujets</dt><dd>{offer.topics.join(", ")}</dd></div><div><dt className="font-semibold">Langues</dt><dd>{offer.languages.join(", ")}</dd></div><div><dt className="font-semibold">Disponibilité</dt><dd>{offer.availability}</dd></div><div><dt className="font-semibold">Places libres</dt><dd>{Math.max(0, offer.capacity - offer._count.requests)}</dd></div></dl>
    {!session?.user ? <Link href="/login" className="underline">Se connecter pour solliciter ce mentor</Link> : session.user.id === offer.mentorId || existing ? <Link href="/dashboard/mentorship" className="underline">Voir mon suivi</Link> : !session.user.isEmailVerified ? <p>Confirme ton email depuis le tableau de bord avant de faire une demande.</p> : offer._count.requests >= offer.capacity ? <p>Toutes les places sont prises.</p> : <MentorshipForm fields={{ command: "request", id: offer.id }} label="Envoyer ma demande"><label className="flex flex-col gap-2 text-sm">Ton objectif et ce que tu as déjà essayé<textarea name="message" required minLength={40} maxLength={2000} rows={5} className="rounded-md border border-border bg-background p-3" /></label></MentorshipForm>}
    {session?.user && session.user.id !== offer.mentorId && <div className="flex flex-wrap gap-6 border-t border-border pt-5"><ReportForm targetType="MENTORSHIP_OFFER" targetId={offer.id} /><MentorshipForm fields={{ command: "block", id: offer.mentorId }} label="Bloquer le mentorat avec ce membre" /></div>}
  </div>;
}
