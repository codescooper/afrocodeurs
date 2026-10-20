import Link from "next/link";
import { ExternalLink, GitBranch, Handshake } from "lucide-react";
import { ventureDetail } from "./queries";
import { countryName, SECTORS, type Sector, VENTURE_STATUS, COLLAB_STATUS } from "./constants";
import { VentureMark } from "./venture-mark";
import { VentureActionForm } from "./action-form";
import { CommentSection } from "@/features/comments/comment-section";
import { ReportForm } from "@/features/admin/report-form";
import { ContentShare } from "@/components/shared/content-share";

export async function VentureDetail({ slug, overlay = false }: { slug: string; overlay?: boolean }) {
  const { venture: v, session, owner, collaboration } = await ventureDetail(slug);
  const sector = SECTORS[v.sector as Sector] ?? SECTORS.OTHER;
  const path = `/constellation/${v.slug}`;
  return <article className="min-w-0 break-words p-5 sm:p-8">
    {!overlay && <Link href="/constellation" className="mb-6 inline-block text-sm underline">Retour à la Constellation</Link>}
    <header className="border-b border-border pb-6"><div className="flex items-center gap-4 pr-6"><VentureMark {...v} large /><div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground"><span className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: sector.color }} />{sector.label} · {countryName(v.country)}</p><h1 className="mt-1 break-words text-2xl font-bold sm:text-3xl">{v.name}</h1><p className="mt-2 break-words text-sm text-muted-foreground">Déclaré par <Link href={`/u/${v.owner.username}`} className="underline">@{v.owner.username}</Link></p></div></div>
      <p className="mt-5 text-lg">{v.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3"><a href={v.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><ExternalLink className="size-4" />Voir le service</a>{v.openSourceProject && <Link href={`/projects/${v.openSourceProject.slug}`} className="inline-flex items-center gap-2 text-sm underline"><GitBranch className="size-4" />Projet open source associé</Link>}</div>
      {v.status !== "PUBLISHED" && <p role="status" className="mt-4 text-sm text-destructive">Fiche non publique · {VENTURE_STATUS[v.status]}</p>}
    </header>
    <section className="py-6"><h2 className="mb-3 text-lg font-semibold">La réalisation</h2><p className="whitespace-pre-wrap text-sm leading-7">{v.description}</p></section>
    {v.screenshots.length > 0 && <section className="space-y-3 pb-6"><h2 className="text-lg font-semibold">En images</h2><div className="flex snap-x gap-3 overflow-x-auto">{v.screenshots.map((shot, i) => <a href={shot} key={shot} target="_blank" rel="noopener noreferrer" aria-label={`Ouvrir la capture ${i + 1}`} className="block aspect-video w-full shrink-0 snap-center rounded-md border border-border bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${JSON.stringify(shot)})` }} />)}</div></section>}
    <section className="space-y-4 border-y border-border py-6"><h2 className="flex items-center gap-2 text-lg font-semibold"><Handshake className="size-5" />Construire des liens</h2>
      {v.needs.length > 0 ? <ul className="flex flex-wrap gap-2">{v.needs.map((need) => <li key={need} className="rounded-md bg-muted px-3 py-1 text-sm">{need}</li>)}</ul> : <p className="text-sm text-muted-foreground">Le porteur accueille les propositions pertinentes.</p>}
      {v.status !== "PUBLISHED" ? <p className="text-sm text-muted-foreground">Les propositions seront ouvertes après publication.</p> : owner ? <Link href="/dashboard/constellation" className="text-sm underline">Gérer les propositions reçues</Link> : collaboration ? <p className="text-sm">Ta proposition : {COLLAB_STATUS[collaboration.status]}. <Link href="/dashboard/constellation" className="underline">Voir mon suivi</Link></p> : !session?.user ? <Link href="/login" className="text-sm underline">Se connecter pour proposer une collaboration</Link> : !session.user.isEmailVerified ? <p className="text-sm">Confirme ton email depuis le tableau de bord pour proposer une collaboration.</p> : <VentureActionForm fields={{ command: "request", id: v.id }} label="Proposer une collaboration"><label className="grid gap-2 text-sm">Ce que tu proposes, tes compétences et tes disponibilités<textarea name="message" required minLength={40} maxLength={2000} rows={4} className="rounded-md border border-border bg-background p-3" /></label></VentureActionForm>}
    </section>
    <ContentShare title={v.name} path={path} />
    {session?.user && !owner && v.status === "PUBLISHED" && <div className="flex flex-wrap items-start gap-6"><ReportForm targetType="COMMUNITY_VENTURE" targetId={v.id} /><VentureActionForm fields={{ command: "block", id: v.ownerId }} label="Bloquer les collaborations avec ce membre" /></div>}
    {v.status === "PUBLISHED" && <CommentSection targetType="COMMUNITY_VENTURE" targetId={v.id} returnPath={path} />}
    {overlay && <a href={path} className="mt-6 inline-block text-sm underline">Ouvrir la page complète</a>}
  </article>;
}
