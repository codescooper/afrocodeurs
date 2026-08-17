import Link from "next/link";
import { CalendarDays, MapPin, Plus, Video } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { EntityCard } from "@/components/molecules/entity-card";
import { EVENT_FORMAT_LABELS, EVENT_TYPE_LABELS } from "@/features/events/constants";
export const metadata = { title: "Événements" };
export default async function EventsPage() {
  const [session, events] = await Promise.all([auth(), db.event.findMany({ where: { status: "PUBLISHED", endsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, include: { community: { select: { name: true } }, _count: { select: { registrations: true } } } })]);
  return <div className="mx-auto w-full max-w-5xl px-4 py-12"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Événements AfroCodeurs</h1><p className="mt-2 max-w-2xl text-muted-foreground">Lives, ateliers, mentorat et rencontres, en ligne, en présentiel ou en format hybride.</p></div>{session?.user && <Link href="/events/new" className={buttonVariants({ size: "lg" })}><Plus />Proposer un événement</Link>}</div>{events.length === 0 ? <p className="mt-10 rounded-xl border border-dashed p-10 text-center text-muted-foreground">Aucun événement à venir.</p> : <div className="mt-8 grid gap-4 md:grid-cols-2">{events.map(e => <EntityCard key={e.id} href={`/events/${e.slug}`} icon={e.format === "IN_PERSON" ? MapPin : Video} eyebrow={e.community?.name ?? EVENT_TYPE_LABELS[e.type]} badge={EVENT_FORMAT_LABELS[e.format]} title={e.title} description={e.summary} meta={<><CalendarDays className="size-3.5" />{e.startsAt.toLocaleString("fr-FR", { timeZone: e.timezone, dateStyle: "medium", timeStyle: "short" })}<span>·</span>{e._count.registrations} inscrit·e·s</>} />)}</div>}</div>;
}
