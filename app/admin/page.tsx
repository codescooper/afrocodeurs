import Link from "next/link";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { Button, buttonVariants } from "@/components/ui/button";
import { moderateKnowledgeAction } from "@/features/knowledge/actions";
import { KNOWLEDGE_TYPE_LABELS } from "@/features/knowledge/constants";
import { REPORT_REASON_LABELS } from "@/features/admin/constants";
import { moderateChallengeAction } from "@/features/challenges/actions";
import { CHALLENGE_DIFFICULTY_LABELS } from "@/features/challenges/constants";
import { createPlatformUpdateAction } from "@/features/updates/actions";

export const metadata = { title: "Administration" };

/** Panneau d'administration : validation, signalements, utilisateurs (Sprint 8). */
export default async function AdminPage() {
  const session = await auth();
  const isAdmin = can(session?.user?.role, "user:manage");

  const [pending, pendingChallenges, reports, userCount, recentUpdates] = await Promise.all([
    db.knowledge.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { username: true, name: true } } },
    }),
    db.challenge.findMany({
      where: { status: { in: ["SUBMITTED", "TESTING"] } },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { username: true, name: true } } },
    }),
    db.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { username: true } } },
    }),
    db.user.count(),
    db.platformUpdate.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Administration</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Membres", userCount],
          ["À valider", pending.length],
          ["Énigmes", pendingChallenges.length],
          ["Signalements", reports.length],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-background p-5 text-center"
          >
            <div className="text-2xl font-bold text-primary">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/users"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Gérer les utilisateurs
          </Link>
          <Link href="/admin/feedback" className={buttonVariants({ variant: "outline", size: "sm" })}>Demandes produit</Link>
          <Link href="/admin/audit" className={buttonVariants({ variant: "outline", size: "sm" })}>Journal des actions</Link>
          <Link href="/updates#roadmap" className={buttonVariants({ variant: "outline", size: "sm" })}>Objectifs de développement</Link>
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold">Contenus à valider</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aucun contenu en attente.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {pending.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
              >
                <span className="flex flex-col">
                  <Link
                    href={`/knowledge/${item.slug}`}
                    className="font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {KNOWLEDGE_TYPE_LABELS[item.type]} · par{" "}
                    {item.author.name ?? `@${item.author.username}`}
                  </span>
                </span>
                <span className="flex gap-2">
                  <form action={moderateKnowledgeAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="slug" value={item.slug} />
                    <input type="hidden" name="decision" value="publish" />
                    <Button type="submit" size="sm">
                      Publier
                    </Button>
                  </form>
                  <form action={moderateKnowledgeAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="slug" value={item.slug} />
                    <input type="hidden" name="decision" value="reject" />
                    <Button type="submit" size="sm" variant="destructive">
                      Rejeter
                    </Button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && <section className="rounded-xl border border-border p-5"><h2 className="text-lg font-semibold">Publier une nouveauté</h2><p className="mt-1 text-sm text-muted-foreground">Elle apparaîtra dans le journal, sur le tableau de bord des membres et dans leurs notifications.</p><form action={createPlatformUpdateAction} className="mt-5 grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-1 text-sm font-medium">Version<input name="version" required maxLength={40} placeholder="Août 2026" className="rounded-md border border-border bg-background px-3 py-2" /></label><label className="flex flex-col gap-1 text-sm font-medium">Catégorie<input name="category" required maxLength={40} defaultValue="NOUVEAUTÉ" className="rounded-md border border-border bg-background px-3 py-2" /></label></div><label className="flex flex-col gap-1 text-sm font-medium">Titre<input name="title" required minLength={5} maxLength={140} className="rounded-md border border-border bg-background px-3 py-2" /></label><label className="flex flex-col gap-1 text-sm font-medium">Résumé<input name="summary" required minLength={10} maxLength={320} className="rounded-md border border-border bg-background px-3 py-2" /></label><label className="flex flex-col gap-1 text-sm font-medium">Détails en Markdown<textarea name="content" required minLength={20} rows={8} className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm" /></label><Button type="submit" className="w-fit">Publier et notifier les membres</Button></form>{recentUpdates.length > 0 && <div className="mt-6 border-t border-border pt-4"><h3 className="text-sm font-semibold">Dernières publications</h3><ul className="mt-2 space-y-2">{recentUpdates.map((update) => <li key={update.id} className="flex justify-between gap-3 text-sm"><span>{update.title}</span><span className="text-muted-foreground">{update.version}</span></li>)}</ul></div>}</section>}

      <section>
        <h2 className="text-lg font-semibold">Énigmes à valider</h2>
        {pendingChallenges.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Aucune énigme en attente.</p> : <ul className="mt-4 flex flex-col gap-2">{pendingChallenges.map((challenge) => <li key={challenge.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3"><span className="flex flex-col"><Link href={`/challenges/${challenge.slug}`} className="font-medium hover:underline">{challenge.title}</Link><span className="text-xs text-muted-foreground">{CHALLENGE_DIFFICULTY_LABELS[challenge.difficulty]} · par {challenge.author.name ?? `@${challenge.author.username}`}</span></span><span className="flex flex-wrap gap-2"><form action={moderateChallengeAction}><input type="hidden" name="id" value={challenge.id} /><input type="hidden" name="decision" value="testing" /><Button type="submit" size="sm" variant="outline">Mettre en test</Button></form><form action={moderateChallengeAction}><input type="hidden" name="id" value={challenge.id} /><input type="hidden" name="decision" value="publish" /><Button type="submit" size="sm">Publier 7 jours</Button></form><form action={moderateChallengeAction}><input type="hidden" name="id" value={challenge.id} /><input type="hidden" name="decision" value="reject" /><Button type="submit" size="sm" variant="destructive">Rejeter</Button></form></span></li>)}</ul>}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Signalements ouverts</h2>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aucun signalement ouvert.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
              >
                <span className="flex flex-col">
                  <span className="font-medium">
                    {REPORT_REASON_LABELS[report.reason]} ·{" "}
                    <span className="text-xs uppercase text-muted-foreground">
                      {report.targetType}
                    </span>
                  </span>
                  {report.details && (
                    <span className="text-xs text-muted-foreground">
                      {report.details}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    signalé par @{report.reporter.username}
                  </span>
                </span>
                <Link
                  href={`/admin/reports/${report.id}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  Traiter
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
