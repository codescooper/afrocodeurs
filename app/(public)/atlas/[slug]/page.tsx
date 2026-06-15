import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Eye, Globe, MapPin, Scale } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SOLUTION_TYPE_LABELS } from "@/features/solutions/constants";
import { ReportForm } from "@/features/admin/report-form";

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
    include: { createdBy: { select: { username: true, name: true } } },
  });

  if (!solution) notFound();

  await db.solution.update({
    where: { id: solution.id },
    data: { views: { increment: 1 } },
  });

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
      <p className="mt-2 text-sm text-muted-foreground">
        Référencé par{" "}
        <Link
          href={`/u/${solution.createdBy.username}`}
          className="font-medium text-foreground hover:underline"
        >
          {solution.createdBy.name ?? `@${solution.createdBy.username}`}
        </Link>
      </p>

      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
        {solution.description}
      </div>

      <dl className="mt-8 flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-muted-foreground" />
          {solution.views} vue{solution.views > 1 ? "s" : ""}
        </div>
        {solution.country && (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            {solution.country}
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

      {session?.user && (
        <div className="mt-10 border-t border-border pt-4">
          <ReportForm targetType="SOLUTION" targetId={solution.id} />
        </div>
      )}
    </div>
  );
}
