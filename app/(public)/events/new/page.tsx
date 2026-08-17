import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventForm } from "@/features/events/event-form";
export const metadata = { title: "Proposer un événement" };
export default async function NewEventPage() { const session = await auth(); const communities = await db.community.findMany({ where: { members: { some: { userId: session!.user.id } } }, select: { id: true, name: true }, orderBy: { name: "asc" } }); return <div className="mx-auto w-full max-w-3xl px-4 py-12"><h1 className="text-3xl font-bold">Proposer un événement</h1><p className="mt-2 mb-8 text-muted-foreground">Référencez un rendez-vous physique, digital ou hybride.</p><EventForm communities={communities} /></div>; }
