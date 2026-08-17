import "server-only";

import { db } from "@/lib/db";

/** Accepte une provenance uniquement si l'auteur appartient réellement à la communauté. */
export async function communityIdForMember(userId: string, raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw) return null;
  const membership = await db.communityMember.findUnique({
    where: { userId_communityId: { userId, communityId: raw } },
    select: { communityId: true },
  });
  return membership?.communityId ?? null;
}

export async function postingCommunityBySlug(userId: string, slug: string | undefined) {
  if (!slug) return null;
  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, members: { where: { userId }, select: { id: true } } },
  });
  return community?.members.length ? { id: community.id, name: community.name, slug: community.slug } : null;
}
