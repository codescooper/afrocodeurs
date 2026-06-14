import Link from "next/link";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getReputation } from "@/features/reputation/queries";
import { VerifyEmailBanner } from "@/features/auth/verify-email-banner";

export const metadata = { title: "Tableau de bord" };

const BLOCKS = [
  { title: "Activité", hint: "Questions suivies, communautés, contributions." },
  { title: "Recommandations", hint: "Ressources, problèmes et communautés pour vous." },
  { title: "Tendances", hint: "Contenus populaires de la communauté." },
];

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;
  const rep = await getReputation(user.id);
  const account = await db.user.findUnique({
    where: { id: user.id },
    select: { emailVerified: true },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Bienvenue, {user.name ?? `@${user.username}`} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Niveau{" "}
            <span className="font-medium text-foreground">
              {rep.level.label}
            </span>{" "}
            · {rep.total} pts
            {rep.next
              ? ` · ${rep.next.min - rep.total} vers ${rep.next.label}`
              : ""}
          </p>
        </div>
        <Link
          href="/afromakers"
          className="text-sm font-medium text-foreground underline"
        >
          Classement AfroMakers →
        </Link>
      </div>

      {!account?.emailVerified && <VerifyEmailBanner />}

      <div className="grid gap-4 md:grid-cols-3">
        {BLOCKS.map((b) => (
          <section
            key={b.title}
            className="rounded-lg border border-border bg-background p-5"
          >
            <h2 className="font-semibold">{b.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{b.hint}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
