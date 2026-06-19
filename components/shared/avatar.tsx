function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((w) => w[0]).join("");
  return (letters || name[0] || "?").toUpperCase();
}

/** Avatar d'un membre : photo si présente, sinon initiales sur fond de marque. */
export function Avatar({
  image,
  name,
  size = 40,
}: {
  image?: string | null;
  name: string;
  size?: number;
}) {
  if (image) {
    return (
      <span
        role="img"
        aria-label={name}
        className="inline-block shrink-0 rounded-full bg-muted bg-cover bg-center"
        style={{ width: size, height: size, backgroundImage: `url(${image})` }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initialsOf(name)}
    </span>
  );
}
