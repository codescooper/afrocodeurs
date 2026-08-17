import Link from "next/link";
import { notFound } from "next/navigation";

import { CommunityEditForm } from "@/features/communities/community-edit-form";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

export const metadata = { title: "Modifier la communauté" };

export default async function EditCommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const community = await db.community.findUnique({
    where: { slug },
    include: { members: { orderBy: { joinedAt: "asc" }, select: { id: true, userId: true, role: true, chatMutedUntil: true, user: { select: { username: true, name: true } } } } },
  });
  if (!community) notFound();

  const allowed = can(session.user.role, "community:manage") || community.members.some((member) => member.userId === session.user.id && member.role === "ADMIN");
  if (!allowed) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href={`/communities/${community.slug}`} className="text-sm text-muted-foreground hover:text-foreground">← Retour à la communauté</Link>
      <h1 className="mt-4 text-3xl font-bold">Modifier {community.name}</h1>
      <p className="mt-2 text-muted-foreground">Mettez à jour sa présentation ou gérez sa suppression.</p>
      <div className="mt-8"><CommunityEditForm community={community} /></div>
    </div>
  );
}
