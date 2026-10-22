import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar } from "@/components/shared/avatar";
import { blockedMentorshipIds, memberSelect } from "@/features/mentorship/queries";

export const metadata = { title: "Mentorat" };
export default async function MentorshipPage({ searchParams }: { searchParams: Promise<{ q?: string; language?: string; page?: string }> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const language = typeof params.language === "string" ? params.language.trim().toLowerCase().slice(0, 40) : "";
  const page = Math.min(1000, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const session = await auth();
  const blocked = await blockedMentorshipIds(session?.user?.id);
  const where = { active: true, suspendedAt: null, mentorId: { notIn: blocked }, mentor: { emailVerified: { not: null } },
    ...(language ? { languages: { has: language } } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { topics: { has: q.toLowerCase() } }] } : {}),
  };
  const offers = await db.mentorshipOffer.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * 20, take: 21,
    include: { mentor: { select: memberSelect }, _count: { select: { requests: { where: { status: "ACCEPTED" } } } } } });
  return <div className="mx-auto w-full max-w-5xl px-4 py-10">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-bold">Mentorat</h1><Link className="text-sm underline" href="/dashboard/mentorship">Mon espace mentorat</Link></div>
    <form className="my-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <label className="text-sm">Sujet<input className="mt-1 w-full rounded-md border border-border bg-background p-2" name="q" defaultValue={q} maxLength={80} /></label>
      <label className="text-sm">Langue<input className="mt-1 w-full rounded-md border border-border bg-background p-2" name="language" defaultValue={language} maxLength={40} /></label>
      <button className="self-end rounded-md border border-border px-4 py-2 text-sm" type="submit">Rechercher</button>
    </form>
    {!offers.length && <p className="py-10 text-muted-foreground">Aucun mentor disponible pour ces critères.</p>}
    <div className="divide-y divide-border">{offers.slice(0, 20).map((offer) => <article key={offer.id} className="flex items-start gap-4 py-6">
      <Avatar image={offer.mentor.image} name={offer.mentor.name ?? offer.mentor.username} size={48} />
      <div className="min-w-0 flex-1 break-words"><h2 className="text-lg font-semibold"><Link href={`/mentorship/${offer.id}`} className="hover:underline">{offer.title}</Link></h2>
        <p className="text-sm text-muted-foreground">@{offer.mentor.username} · {offer.languages.join(", ")}</p>
        <p className="mt-2 text-sm">{offer.topics.join(" · ")}</p><p className="mt-1 text-sm text-muted-foreground">{offer.availability} · {Math.max(0, offer.capacity - offer._count.requests)} place(s)</p>
      </div>
    </article>)}</div>
    <nav aria-label="Pages des mentors" className="mt-6 flex gap-6">{page > 1 && <Link href={`/mentorship?${new URLSearchParams({ q, language, page: String(page - 1) })}`}>Précédente</Link>}{offers.length > 20 && <Link href={`/mentorship?${new URLSearchParams({ q, language, page: String(page + 1) })}`}>Suivante</Link>}</nav>
  </div>;
}
