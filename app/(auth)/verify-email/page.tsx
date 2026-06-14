import Link from "next/link";

import { db } from "@/lib/db";

export const metadata = { title: "Vérification de l'email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let status: "ok" | "invalid" | "missing" = "missing";
  if (token) {
    const record = await db.verificationToken.findUnique({ where: { token } });
    if (
      record &&
      record.identifier.startsWith("verify:") &&
      record.expires > new Date()
    ) {
      const email = record.identifier.slice("verify:".length);
      await db.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      });
      await db.verificationToken.deleteMany({
        where: { identifier: record.identifier },
      });
      status = "ok";
    } else {
      status = "invalid";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Vérification de l&apos;email</h1>
      {status === "ok" && (
        <p className="rounded-md border border-border bg-muted/40 p-4 text-sm">
          ✓ Ton adresse email est confirmée, merci !{" "}
          <Link
            href="/dashboard"
            className="font-medium text-foreground underline"
          >
            Aller au tableau de bord
          </Link>
        </p>
      )}
      {status === "invalid" && (
        <p className="text-sm text-destructive">
          Lien invalide ou expiré. Connecte-toi et demande un nouvel email de
          confirmation.
        </p>
      )}
      {status === "missing" && (
        <p className="text-sm text-destructive">Token manquant.</p>
      )}
    </div>
  );
}
