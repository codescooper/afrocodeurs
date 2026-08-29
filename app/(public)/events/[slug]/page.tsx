import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  MessageCircle,
  RefreshCw,
  Users,
  Video,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button, buttonVariants } from "@/components/ui/button";
import { Markdown } from "@/components/shared/markdown";
import {
  EVENT_FORMAT_LABELS,
  EVENT_TYPE_LABELS,
} from "@/features/events/constants";
import {
  retryDiscordEventSyncAction,
  toggleEventRegistrationAction,
} from "@/features/events/actions";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, session] = await Promise.all([params, auth()]);
  const event = await db.event.findUnique({
    where: { slug },
    include: {
      organizer: { select: { id: true, username: true, name: true } },
      community: { select: { slug: true, name: true } },
      registrations: {
        select: {
          userId: true,
          user: { select: { username: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!event) notFound();

  const registered = Boolean(
    session?.user &&
      event.registrations.some((item) => item.userId === session.user.id),
  );
  const owner = session?.user?.id === event.organizerId;
  const canSeeLink = owner || registered;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
          {EVENT_TYPE_LABELS[event.type]}
        </span>
        <span className="rounded-full bg-muted px-3 py-1">
          {EVENT_FORMAT_LABELS[event.format]}
        </span>
        {event.community && (
          <Link
            className="rounded-full bg-muted px-3 py-1"
            href={`/communities/${event.community.slug}`}
          >
            {event.community.name}
          </Link>
        )}
        {event.discordSyncStatus === "SYNCED" && (
          <span className="rounded-full bg-[#5865f2]/15 px-3 py-1 text-[#5865f2]">
            Synchronisé avec Discord
          </span>
        )}
      </div>

      <h1 className="mt-4 text-4xl font-bold">{event.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{event.summary}</p>

      <div className="mt-6 grid gap-3 rounded-xl border p-5 sm:grid-cols-2">
        <p className="flex gap-2">
          <CalendarDays className="size-5 text-primary" />
          <span>
            {event.startsAt.toLocaleString("fr-FR", {
              timeZone: event.timezone,
              dateStyle: "long",
              timeStyle: "short",
            })}{" — "}
            {event.endsAt.toLocaleTimeString("fr-FR", {
              timeZone: event.timezone,
              hour: "2-digit",
              minute: "2-digit",
            })}
            <br />
            {event.timezone}
          </span>
        </p>
        <p className="flex gap-2">
          <Users className="size-5 text-primary" />
          {event.registrations.length}
          {event.capacity ? ` / ${event.capacity}` : ""} participant·e·s
        </p>
        {event.format !== "ONLINE" && (
          <p className="flex gap-2">
            <MapPin className="size-5 text-primary" />
            {[event.venue, event.city, event.country].filter(Boolean).join(", ")}
          </p>
        )}
        {event.format !== "IN_PERSON" && (
          <p className="flex gap-2">
            <Video className="size-5 text-primary" />
            {event.platform ?? "En ligne"}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {session?.user ? (
          <form action={toggleEventRegistrationAction}>
            <input type="hidden" name="eventId" value={event.id} />
            <Button variant={registered ? "outline" : "default"}>
              {registered ? "Annuler ma participation" : "Je participe"}
            </Button>
          </form>
        ) : (
          <Link href="/login" className={buttonVariants()}>
            Se connecter pour participer
          </Link>
        )}
        {event.discordEventUrl && (
          <a
            href={event.discordEventUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            Voir l’événement Discord <MessageCircle />
          </a>
        )}
        {event.accessUrl && canSeeLink && (
          <a
            href={event.accessUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            Accéder au direct <ExternalLink />
          </a>
        )}
      </div>

      {event.accessUrl && !canSeeLink && (
        <p className="mt-3 text-sm text-muted-foreground">
          Le lien du direct est réservé aux personnes inscrites.
        </p>
      )}

      {owner && event.discordSyncStatus === "FAILED" && (
        <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold">Synchronisation Discord incomplète</p>
          <p className="mt-1 text-muted-foreground">
            {event.discordSyncError ?? "Discord n’a pas accepté cet événement."}
          </p>
          <form action={retryDiscordEventSyncAction} className="mt-3">
            <input type="hidden" name="eventId" value={event.id} />
            <Button type="submit" variant="outline" size="sm">
              <RefreshCw /> Réessayer
            </Button>
          </form>
        </div>
      )}

      <article className="mt-10 rounded-xl border p-6">
        <Markdown>{event.description}</Markdown>
      </article>
      <p className="mt-6 text-sm text-muted-foreground">
        Organisé par{" "}
        <Link className="underline" href={`/u/${event.organizer.username}`}>
          {event.organizer.name ?? `@${event.organizer.username}`}
        </Link>
      </p>
    </div>
  );
}
