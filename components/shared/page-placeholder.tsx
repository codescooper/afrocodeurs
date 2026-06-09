/** Bloc d'en-tête de page réutilisable pour les sections en construction (MVP). */
export function PagePlaceholder({
  title,
  description,
  sprint,
}: {
  title: string;
  description: string;
  sprint?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Module en cours de construction{sprint ? ` — ${sprint}` : ""}.
      </div>
    </div>
  );
}
