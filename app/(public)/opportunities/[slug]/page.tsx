import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, MapPin, MessageSquare, UserRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { OPPORTUNITY_TYPE_LABELS } from "@/features/opportunities/constants";
import { OpportunityResponseForm } from "@/features/opportunities/response-form";
import { startDirectConversationAction } from "@/features/messaging/actions";
import { CommentSection } from "@/features/comments/comment-section";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await db.opportunity.findUnique({ where: { slug }, select: { title: true, summary: true } });
  return item ? { title: item.title, description: item.summary } : {};
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const opportunity = await db.opportunity.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, username: true, name: true, image: true } },
      responses: { orderBy: { updatedAt: "desc" }, include: { user: { select: { id: true, username: true, name: true, image: true } } } },
      _count: { select: { responses: true } },
    },
  });
  if (!opportunity || opportunity.status === "ARCHIVED") notFound();
  const isAuthor = session?.user?.id === opportunity.authorId;
  const ownResponse = !isAuthor ? opportunity.responses.find((response) => response.userId === session?.user?.id) : undefined;

  return <div className="mx-auto w-full max-w-5xl px-4 py-12">
    <Link href="/opportunities" className="text-sm text-muted-foreground hover:text-foreground">← Toutes les opportunités</Link>
    <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <article>
        <div className="flex flex-wrap items-center gap-2"><Badge>{OPPORTUNITY_TYPE_LABELS[opportunity.type]}</Badge>{opportunity.status === "CLOSED" && <Badge variant="outline">Clôturée</Badge>}</div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{opportunity.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{opportunity.organization}</p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><MapPin className="size-4" />{opportunity.isRemote ? "Accessible à distance" : opportunity.location ?? "Lieu à préciser"}</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="size-4" />{opportunity.deadline ? `Date limite : ${opportunity.deadline.toLocaleDateString("fr-FR")}` : "Sans date limite"}</span>
          <span className="flex items-center gap-1.5"><UserRound className="size-4" />{opportunity._count.responses} réponse(s)</span>
        </div>
        <p className="mt-8 rounded-xl border-l-4 border-primary bg-primary/5 p-5 text-lg">{opportunity.summary}</p>
        <section className="mt-10"><h2 className="text-xl font-semibold">À propos de l’opportunité</h2><div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{opportunity.description}</div></section>
        {opportunity.requirements && <section className="mt-10"><h2 className="text-xl font-semibold">Prérequis et profil recherché</h2><div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{opportunity.requirements}</div></section>}
        {isAuthor && opportunity.responses.length > 0 && <section className="mt-10"><h2 className="text-xl font-semibold">Réponses reçues</h2><div className="mt-4 space-y-3">{opportunity.responses.map((response) => <div key={response.id} className="rounded-xl border border-border p-4"><div className="flex items-center gap-3"><Avatar image={response.user.image} name={response.user.name ?? response.user.username} size={36} /><div><Link href={`/u/${response.user.username}`} className="font-semibold hover:underline">{response.user.name ?? `@${response.user.username}`}</Link><p className="text-xs text-muted-foreground">{response.kind === "APPLICATION" ? "Candidature" : "Intérêt"}</p></div></div>{response.message && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{response.message}</p>}<form action={startDirectConversationAction} className="mt-3"><input type="hidden" name="recipientId" value={response.user.id} /><Button type="submit" size="sm" variant="outline"><MessageSquare />Répondre</Button></form></div>)}</div></section>}
        <CommentSection targetType="OPPORTUNITY" targetId={opportunity.id} returnPath={`/opportunities/${opportunity.slug}`} />
      </article>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border border-border p-5"><p className="text-xs uppercase tracking-wide text-muted-foreground">Publié par</p><Link href={`/u/${opportunity.author.username}`} className="mt-3 flex items-center gap-3 hover:underline"><Avatar image={opportunity.author.image} name={opportunity.author.name ?? opportunity.author.username} size={44} /><span><b className="block">{opportunity.author.name ?? opportunity.author.username}</b><span className="text-xs text-muted-foreground">@{opportunity.author.username}</span></span></Link>
          {session?.user && !isAuthor && <form action={startDirectConversationAction} className="mt-4"><input type="hidden" name="recipientId" value={opportunity.author.id} /><Button type="submit" variant="outline" className="w-full"><MessageSquare />Discuter avec l’auteur</Button></form>}
        </div>
        {opportunity.externalUrl && <a href={opportunity.externalUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", className: "w-full" })}><ExternalLink />Voir le lien officiel</a>}
        {!session?.user ? <Link href="/login" className={buttonVariants({ className: "w-full" })}>Se connecter pour répondre</Link> : !isAuthor && opportunity.status === "ACTIVE" ? <OpportunityResponseForm opportunityId={opportunity.id} initialKind={ownResponse?.kind} /> : null}
      </aside>
    </div>
  </div>;
}
