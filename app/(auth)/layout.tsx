import Link from "next/link";

/** Layout d'authentification : carte centrée, sans chrome applicatif. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold">
        <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
          A
        </span>
        AfroCodeurs
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
