import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-xl font-bold">Page introuvable</h1>
      <p className="text-sm text-muted-foreground">
        Cette page n&apos;existe pas, ou elle a été déplacée.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
