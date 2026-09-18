import { Download, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewsletterAddForm } from "@/features/admin/newsletter-add-form";
import { NewsletterDeleteForm } from "@/features/admin/newsletter-delete-form";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

export const metadata = { title: "Gestion de la newsletter" };

const PAGE_SIZE = 50;

type NewsletterPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

function startOfUtcDay(date = new Date()) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function pageHref(page: number, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return suffix ? "/admin/newsletter?" + suffix : "/admin/newsletter";
}

function sourceLabel(source: string) {
  if (source === "construction") return "Page de construction";
  if (source === "admin") return "Administration";
  return source;
}

export default async function NewsletterAdminPage({
  searchParams,
}: NewsletterPageProps) {
  const session = await auth();
  if (!can(session?.user?.role, "newsletter:manage")) redirect("/admin");

  const rawParams = await searchParams;
  const query = rawParams.q?.trim().slice(0, 254) ?? "";
  const requestedPage = Number.parseInt(rawParams.page ?? "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const where = query
    ? { email: { contains: query, mode: "insensitive" as const } }
    : undefined;

  const today = startOfUtcDay();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );

  const [total, todayCount, weekCount, monthCount, filteredCount] =
    await Promise.all([
      db.newsletterSubscriber.count(),
      db.newsletterSubscriber.count({ where: { createdAt: { gte: today } } }),
      db.newsletterSubscriber.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      db.newsletterSubscriber.count({
        where: { createdAt: { gte: monthStart } },
      }),
      db.newsletterSubscriber.count({ where }),
    ]);

  const pageCount = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const subscribers = await db.newsletterSubscriber.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: { id: true, email: true, source: true, createdAt: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Administration
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Newsletter</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Adresses collectées depuis la page de construction et ajoutées par
            l’administration.
          </p>
        </div>
        <a
          href="/api/admin/newsletter/export"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Download />
          Exporter en CSV
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total", total],
          ["Aujourd’hui", todayCount],
          ["7 derniers jours", weekCount],
          ["Ce mois", monthCount],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-2xl font-bold text-primary">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Inscription manuelle</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Ajoute uniquement une personne ayant accepté de recevoir les
          communications AfroCodeurs.
        </p>
        <NewsletterAddForm />
      </section>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Rechercher une adresse</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query}
            maxLength={254}
            placeholder="Rechercher une adresse e-mail…"
            className="pl-9"
          />
        </label>
        <button
          className={buttonVariants({ variant: "outline" })}
          type="submit"
        >
          Rechercher
        </button>
        {query && (
          <Link
            href="/admin/newsletter"
            className={buttonVariants({ variant: "ghost" })}
          >
            Effacer
          </Link>
        )}
      </form>

      <section className="overflow-hidden rounded-xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-muted px-4 py-3 text-sm">
          <span className="font-medium">
            {filteredCount} adresse{filteredCount > 1 ? "s" : ""}
            {query ? " correspondant à « " + query + " »" : ""}
          </span>
          <span className="text-muted-foreground">
            Page {currentPage} sur {pageCount}
          </span>
        </div>

        {subscribers.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Aucune adresse trouvée.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-t border-border bg-background">
                  <th className="p-3">Adresse</th>
                  <th className="p-3">Origine</th>
                  <th className="p-3">Inscription</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-t border-border">
                    <td className="p-3 font-medium">{subscriber.email}</td>
                    <td className="p-3 text-muted-foreground">
                      {sourceLabel(subscriber.source)}
                    </td>
                    <td className="whitespace-nowrap p-3 text-muted-foreground">
                      {subscriber.createdAt.toLocaleString("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end">
                        <NewsletterDeleteForm
                          id={subscriber.id}
                          email={subscriber.email}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pageCount > 1 && (
        <nav
          className="flex items-center justify-between"
          aria-label="Pagination newsletter"
        >
          {currentPage > 1 ? (
            <Link
              href={pageHref(currentPage - 1, query)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              ← Précédente
            </Link>
          ) : (
            <span />
          )}
          {currentPage < pageCount && (
            <Link
              href={pageHref(currentPage + 1, query)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Suivante →
            </Link>
          )}
        </nav>
      )}

      <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        Cette liste contient des données personnelles. Ne partage pas l’export
        publiquement et supprime-le après usage.
      </p>
    </div>
  );
}
