import { MapPin, Users } from "lucide-react";
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
    },
  });

  if (!community) notFound();

  const userId = session?.user?.id;
  const isMember = userId
    ? community.members.some((member) => member.userId === userId)
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
        )}
      </div>

      {community.description && (
        <p className="mt-6 max-w-2xl text-muted-foreground">
          {community.description}
        </p>
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
