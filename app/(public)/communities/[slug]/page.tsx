import { BookOpen, CircleHelp, MapPin, Settings, TriangleAlert, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ReportForm } from "@/features/admin/report-form";
import {
  joinCommunityAction,
  leaveCommunityAction,
} from "@/features/communities/actions";
import { COMMUNITY_TYPE_LABELS } from "@/features/communities/constants";
import { MembersRow } from "@/features/communities/members-row";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChatRoom } from "@/features/messaging/chat-room";

/** Page détail d'une communauté + rejoindre/quitter (Sprint 2). */
export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const community = await db.community.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: { select: { username: true, name: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      knowledge: { where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 6, select: { id: true, slug: true, title: true, summary: true, lastVerifiedAt: true } },
      problems: { orderBy: { createdAt: "desc" }, take: 6, select: { id: true, slug: true, title: true, summary: true } },
      questions: { orderBy: { createdAt: "desc" }, take: 6, select: { id: true, slug: true, title: true, status: true } },
      chat: { select: { id: true, messages: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 101, select: { id: true, body: true, createdAt: true, authorId: true, author: { select: { username: true, name: true, image: true } } } } } },
    },
  });

  if (!community) notFound();

  const userId = session?.user?.id;
  const isMember = userId
    ? community.members.some((member) => member.userId === userId)
    : false;
  const myMembership = userId
    ? community.members.find((member) => member.userId === userId)
    : undefined;
  const canManage = session?.user
    ? session.user.role === "ADMIN" || myMembership?.role === "ADMIN"
    : false;
  const location = [community.city, community.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <Link
        href="/communities"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Toutes les communautés
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            {COMMUNITY_TYPE_LABELS[community.type]}
          </span>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {community.name}
          </h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {community.members.length} membre
              {community.members.length > 1 ? "s" : ""}
            </span>
            {location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {location}
              </span>
            )}
          </div>
        </div>

        {session?.user && (
          <div className="flex flex-wrap gap-2">
          {canManage && <Link href={`/communities/${community.slug}/edit`}><Button type="button" variant="outline"><Settings /> Gérer</Button></Link>}
          <form action={isMember ? leaveCommunityAction : joinCommunityAction}>
            <input type="hidden" name="communityId" value={community.id} />
            <input type="hidden" name="slug" value={community.slug} />
            <Button
              type="submit"
              variant={isMember ? "outline" : "primary"}
              shape="pill"
            >
              {isMember ? "Quitter" : "Rejoindre"}
            </Button>
          </form>
          </div>
        )}
      </div>

      {community.description && (
        <p className="mt-6 max-w-2xl text-muted-foreground">
          {community.description}
        </p>
      )}

      {isMember && (
        <section className="mt-8 rounded-xl border border-primary/25 bg-primary/5 p-5">
          <h2 className="font-semibold">Publier depuis {community.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Le contenu apparaîtra ici et restera accessible dans son espace général.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/knowledge/new?community=${community.slug}`}><Button size="sm"><BookOpen /> Ressource</Button></Link>
            <Link href={`/knowledge/new?community=${community.slug}&type=LINK`}><Button size="sm" variant="outline">Partager un lien</Button></Link>
            <Link href={`/explorer/new?community=${community.slug}`}><Button size="sm" variant="outline"><TriangleAlert /> Problème</Button></Link>
            <Link href={`/forum/new?community=${community.slug}`}><Button size="sm" variant="outline"><CircleHelp /> Discussion</Button></Link>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Fil de la communauté</h2>
        {community.knowledge.length + community.problems.length + community.questions.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Aucun contenu publié depuis cette communauté pour le moment.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <CommunityContentSection title="Ressources" icon={<BookOpen className="size-4" />} items={community.knowledge.map((item) => ({ href: `/knowledge/${item.slug}`, title: item.title, detail: item.summary, badge: item.lastVerifiedAt ? "Vérifié" : "Non vérifié" }))} />
            <CommunityContentSection title="Problèmes" icon={<TriangleAlert className="size-4" />} items={community.problems.map((item) => ({ href: `/explorer/${item.slug}`, title: item.title, detail: item.summary }))} />
            <CommunityContentSection title="Discussions" icon={<CircleHelp className="size-4" />} items={community.questions.map((item) => ({ href: `/forum/${item.slug}`, title: item.title, badge: item.status }))} />
          </div>
        )}
      </section>

      {isMember && community.chat && userId && (
        <section className="mt-10 overflow-hidden rounded-xl border border-border">
          <header className="border-b border-border bg-muted/40 px-5 py-4"><h2 className="font-semibold">Salon · {community.name}</h2><p className="text-xs text-muted-foreground">Réservé aux membres · historique complet</p></header>
          {session?.user?.isEmailVerified ? <ChatRoom conversationId={community.chat.id} currentUserId={userId} initialMessages={community.chat.messages.slice(0, 100).reverse().map((message) => ({ ...message, createdAt: message.createdAt.toISOString() }))} initialHasMore={community.chat.messages.length > 100} compact canModerate={canManage} /> : <p className="p-6 text-sm text-muted-foreground">Confirmez votre adresse e-mail pour participer au salon.</p>}
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Membres</h2>
        <div className="mt-4">
          <MembersRow members={community.members} rowMax={8} />
        </div>
      </section>

      {session?.user && (
        <div className="mt-10 border-t border-border pt-4">
          <ReportForm targetType="COMMUNITY" targetId={community.id} />
        </div>
      )}
    </div>
  );
}

function CommunityContentSection({ title, icon, items }: { title: string; icon: React.ReactNode; items: Array<{ href: string; title: string; detail?: string | null; badge?: string }> }) {
  return <div className="rounded-xl border border-border p-4"><h3 className="flex items-center gap-2 font-semibold">{icon}{title}</h3>{items.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Aucun contenu.</p> : <ul className="mt-3 space-y-3">{items.map((item) => <li key={item.href}><Link href={item.href} className="block rounded-lg bg-muted/40 p-3 hover:bg-muted"><span className="flex items-start justify-between gap-2"><strong className="text-sm">{item.title}</strong>{item.badge && <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px]">{item.badge}</span>}</span>{item.detail && <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{item.detail}</span>}</Link></li>)}</ul>}</div>;
}
