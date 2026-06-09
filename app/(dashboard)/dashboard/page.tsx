import { auth } from "@/lib/auth";

export const metadata = { title: "Tableau de bord" };

const BLOCKS = [
  { title: "Activité", hint: "Questions suivies, communautés, contributions." },
  { title: "Recommandations", hint: "Ressources, problèmes et communautés pour vous." },
  { title: "Tendances", hint: "Contenus populaires de la communauté." },
];

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">
          Bienvenue, {user.name ?? `@${user.username}`} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Niveau AfroMaker · {user.role}
        </p>
      </div>

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
