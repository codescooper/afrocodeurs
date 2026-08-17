import { db } from "@/lib/db";
import { CommentSection } from "@/features/comments/comment-section";
export default async function EventDetailLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) { const { slug } = await params; const event = await db.event.findUnique({ where: { slug }, select: { id: true } }); return <>{children}{event && <div className="mx-auto w-full max-w-4xl px-4 pb-12"><CommentSection targetType="EVENT" targetId={event.id} returnPath={`/events/${slug}`} /></div>}</>; }
