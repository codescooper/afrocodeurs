import Link from "next/link";
import { Briefcase, CalendarDays, MapPin, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { EntityCard } from "@/components/molecules/entity-card";
import { FilterPills } from "@/components/molecules/filter-pills";
import { buttonVariants } from "@/components/ui/button";
import { OPPORTUNITY_TYPES, OPPORTUNITY_TYPE_LABELS } from "@/features/opportunities/constants";

export const metadata = { title: "Opportunités" };

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const [{ type }, session] = await Promise.all([searchParams, auth()]);
  const selected = OPPORTUNITY_TYPES.includes(type as never) ? type as (typeof OPPORTUNITY_TYPES)[number] : undefined;
  const [opportunities, counts] = await Promise.all([
    db.opportunity.findMany({ where: { status: "ACTIVE", ...(selected ? { type: selected } : {}) }, orderBy: [{ deadline: "asc" }, { createdAt: "desc" }], include: { author: { select: { username: true } }, _count: { select: { responses: true } } } }),
    db.opportunity.groupBy({ by: ["type"], where: { status: "ACTIVE" }, _count: { _all: true } }),
  ]);
  const count = new Map(counts.map((item) => [item.type, item._count._all]));

  return <div className="mx-auto w-full max-w-5xl px-4 py-12">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div><h1 className="text-3xl font-bold tracking-tight">AfroOpportunities</h1><p className="mt-2 max-w-2xl text-muted-foreground">Emplois, stages, bourses, financements et concours proposés par la communauté.</p></div>
      {session?.user && <Link href="/opportunities/new" className={buttonVariants({ size: "lg" })}><Plus />Publier une opportunité</Link>}
    </div>
    <div className="mt-8 overflow-x-auto pb-2"><FilterPills baseHref="/opportunities" paramName="type" options={OPPORTUNITY_TYPES.map((value) => ({ label: OPPORTUNITY_TYPE_LABELS[value], value, count: count.get(value) ?? 0 }))} /></div>
    {opportunities.length === 0 ? <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">Aucune opportunité active dans cette catégorie.</div> : <div className="mt-6 grid gap-4 md:grid-cols-2">{opportunities.map((item) => <EntityCard key={item.id} href={`/opportunities/${item.slug}`} icon={Briefcase} eyebrow={item.organization} badge={OPPORTUNITY_TYPE_LABELS[item.type]} title={item.title} description={item.summary} meta={<><MapPin className="size-3.5" />{item.isRemote ? "À distance" : item.location ?? "Lieu à préciser"}<span>·</span><CalendarDays className="size-3.5" />{item.deadline ? `avant le ${item.deadline.toLocaleDateString("fr-FR")}` : "sans date limite"}<span>·</span>{item._count.responses} intéressé·e·s</>} />)}</div>}
  </div>;
}
