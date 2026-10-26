import { publicContentMetadata } from "@/features/seo/metadata";
import Link from "next/link";
import { ContentShare } from "@/components/shared/content-share";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Eye,
  GitBranch,
  Globe,
  MapPin,
  Scale,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { SOLUTION_TYPE_LABELS } from "@/features/solutions/constants";
import { PROJECT_STATUS_LABELS } from "@/features/projects/constants";
import { ReportForm } from "@/features/admin/report-form";
import { buttonVariants } from "@/components/ui/button";
import { ClaimForm, LicenseReviewForm, GithubProofForm } from "@/features/solutions/claim-forms";
import { claimProofCode, LIFECYCLES, SECTORS } from "@/features/solutions/catalog";

/** Page détail d'une solution de l'AfroAtlas (Sprint 6). */
export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const solution = await db.solution.findUnique({
    where: { slug },
    include: {
      createdBy: { select: { username: true, name: true } },
      maintainers: { select: { userId: true, user: { select: { username: true, name: true } } } },
      projects: {
        where: { status: { not: "ARCHIVED" } },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, slug: true, status: true, communityVentures: { where: { status: "PUBLISHED" }, select: { id: true, name: true, slug: true } } },
      },
    },
  });

  if (!solution) notFound();
  const mine = session?.user ? await db.solutionClaim.findUnique({ where: { solutionId_userId: { solutionId: solution.id, userId: session.user.id } }, select: { id: true, status: true, reviewNote: true } }) : null;
  const canEdit = session?.user?.role === "ADMIN" || solution.maintainers.some(member => member.userId === session?.user?.id);

  await db.solution.update({
    where: { id: solution.id },
    data: { views: { increment: 1 } },
  });

  const problemRelations = await db.entityRelation.findMany({
    where: {
      sourceType: "SOLUTION",
      sourceId: solution.id,
      relationType: "SOLVES",
      targetType: "PROBLEM",
    },
    orderBy: { createdAt: "asc" },
    select: { targetId: true },
  });
  const problems = problemRelations.length
    ? await db.problem.findMany({
        where: { id: { in: problemRelations.map((item) => item.targetId) } },
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true, slug: true },
      })
    : [];
  const canCreateProject = can(session?.user?.role, "project:create");
  const projectHref = `/projects/new?solution=${encodeURIComponent(solution.id)}${
    problems[0] ? `&problem=${encodeURIComponent(problems[0].id)}` : ""
  }`;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <Link
        href="/atlas"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Tout l&apos;Atlas
      </Link>

      <span className="mt-4 block text-xs font-medium uppercase tracking-wide text-primary">
        {SOLUTION_TYPE_LABELS[solution.type]}
      </span>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">
        {solution.name}
      </h1>
      <ContentShare title={solution.name} path={`/atlas/${encodeURIComponent(solution.slug)}`} />
      <p className="mt-3 text-sm font-medium">{solution.licenseVerified && solution.repositoryUrl ? "Licence open source vérifiée" : "Licence open source à vérifier"} · {LIFECYCLES[solution.lifecycle as keyof typeof LIFECYCLES] ?? "État à préciser"}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Référencé par{" "}
        <Link
          href={`/u/${solution.createdBy.username}`}
          className="font-medium text-foreground hover:underline"
        >
          {solution.createdBy.name ?? `@${solution.createdBy.username}`}
        </Link>
      </p>
      <section className="mt-6 border-y border-border py-5">
        <h2 className="font-semibold">Gestion de cette fiche</h2>
        {solution.maintainers.length ? <ul className="mt-2 flex flex-wrap gap-3">{solution.maintainers.map(member => <li key={member.userId}><Link href={`/u/${member.user.username}`} className="underline">{member.user.name ?? `@${member.user.username}`}</Link></li>)}</ul> : <p className="mt-2 text-sm">Référencée par la communauté — non revendiquée.</p>}
        <p className="mt-2 text-sm text-muted-foreground">La gestion vérifiée d’une fiche ne constitue pas une certification de la solution ni un transfert de propriété.</p>
        {canEdit && <Link href={`/atlas/${solution.slug}/edit`} className="mt-3 inline-block underline">Gérer la fiche</Link>}
        {!solution.maintainers.some(member => member.userId === session?.user?.id) && <details className="mt-4"><summary className="cursor-pointer font-medium">Je maintiens cette solution</summary><div className="mt-4">{mine ? <><p>{mine.status === "PENDING" ? "Votre demande est en cours de vérification." : mine.status === "APPROVED" ? "Cette demande a été approuvée. Si votre accès a ensuite été retiré, contactez l’équipe." : "Votre demande a été refusée. Vous pouvez fournir de nouvelles preuves."}</p>{mine.reviewNote && <p className="mt-2 whitespace-pre-wrap">{mine.reviewNote}</p>}{mine.status === "REJECTED" && <div className="mt-4"><ClaimForm solutionId={solution.id} /></div>}</> : session?.user ? <ClaimForm solutionId={solution.id} /> : <Link href="/login" className="underline">Se connecter pour demander la gestion</Link>}</div></details>}
      </section>

      {mine?.status === "PENDING" && session?.user && <aside className="mt-4 border-l-4 border-primary pl-4"><p className="text-sm">Placez ce code personnel à l’emplacement public indiqué dans votre demande (dépôt ou site officiel), puis laissez-le jusqu’à la décision :</p><code className="mt-2 block break-all text-sm">{claimProofCode(mine.id, session.user.id)}</code><p className="mt-2 text-sm">Pour GitHub : créez le fichier <code className="break-all">.afrocodeurs/claims/{mine.id}.txt</code> sur la branche par défaut du dépôt lié à la fiche, avec uniquement ce code.</p><GithubProofForm id={mine.id} /><p className="mt-2 text-sm">Sans accès à ces supports, contactez l’équipe pour une vérification manuelle alternative.</p></aside>}

      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
        {solution.description}
      </div>

      <dl className="mt-8 flex flex-col gap-3 text-sm">
        <div><dt className="font-medium">Secteur</dt><dd>{SECTORS[solution.sector as keyof typeof SECTORS] ?? "Autres usages"}</dd></div>
        <div><dt className="font-medium">Pays d’utilisation</dt><dd>{solution.countriesServed.join(", ") || "Non précisés"}</dd></div>
        <div><dt className="font-medium">Langues disponibles</dt><dd>{solution.languages.join(", ") || "Non précisées"}</dd></div>
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-muted-foreground" />
          {solution.views} vue{solution.views > 1 ? "s" : ""}
        </div>
        {solution.country && (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            Pays d’origine déclaré : {solution.country}
          </div>
        )}
        {solution.license && (
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-muted-foreground" />
            {solution.license}
          </div>
        )}
        {solution.websiteUrl && (
          <a
            href={solution.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent hover:underline"
          >
            <Globe className="size-4" />
            Site web
          </a>
        )}
        {solution.documentationUrl && (
          <a
            href={solution.documentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent hover:underline"
          >
            <BookOpen className="size-4" />
            Documentation
          </a>
        )}
      </dl>
      {solution.repositoryUrl && <a href={solution.repositoryUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block underline">Consulter le dépôt source</a>}
      {solution.africanContext && <section className="mt-8"><h2 className="font-semibold">Équipe et ancrage africain</h2><p className="mt-2 whitespace-pre-wrap text-sm">{solution.africanContext}</p><p className="mt-2 text-xs text-muted-foreground">Informations déclarées sur la fiche.</p></section>}
      {solution.contributionNeeds && <section className="mt-8"><h2 className="font-semibold">Comment contribuer</h2><p className="mt-2 whitespace-pre-wrap text-sm">{solution.contributionNeeds}</p></section>}
      {solution.projects.some(project => project.communityVentures.length) && <section className="mt-8"><h2 className="font-semibold">Réalisations dans la Constellation</h2><ul className="mt-3 space-y-2">{[...new Map(solution.projects.flatMap(project => project.communityVentures).map(venture => [venture.id, venture])).values()].map(venture => <li key={venture.id}><Link href={`/constellation/${venture.slug}`} className="underline">{venture.name}</Link></li>)}</ul></section>}
      {session?.user?.role === "ADMIN" && <details className="mt-8 border-t border-border pt-4"><summary className="cursor-pointer">Vérifier la licence open source</summary><div className="mt-4"><LicenseReviewForm id={solution.id} revision={solution.revision} /></div></details>}

      <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Problème → Solution → Projet
            </p>
            <h2 className="mt-1 text-xl font-bold">Passer à la construction</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Transformez cette solution en projet collaboratif, reliez-la à un
              dépôt GitHub et rendez sa progression visible par toute la
              communauté.
            </p>
          </div>
          {canCreateProject && (
            <Link href={projectHref} className={buttonVariants({ size: "sm" })}>
              Créer le projet
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>

        {problems.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium text-muted-foreground">
              Problème{problems.length > 1 ? "s" : ""} traité
              {problems.length > 1 ? "s" : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {problems.map((problem) => (
                <Link
                  key={problem.id}
                  href={`/explorer/${problem.slug}`}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
                >
                  {problem.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {solution.projects.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium text-muted-foreground">
              Projet{solution.projects.length > 1 ? "s" : ""} issu
              {solution.projects.length > 1 ? "s" : ""} de cette solution
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {solution.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 font-medium hover:bg-muted"
                >
                  <GitBranch className="size-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{project.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {session?.user && (
        <div className="mt-10 border-t border-border pt-4">
          <ReportForm targetType="SOLUTION" targetId={solution.id} />
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return publicContentMetadata("atlas", slug);
}
