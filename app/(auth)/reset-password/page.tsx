import Link from "next/link";

import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata = { title: "Réinitialiser le mot de passe" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground">
          Choisis un nouveau mot de passe pour ton compte.
        </p>
      </div>

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-destructive">
          Lien invalide : le token est manquant.{" "}
          <Link href="/forgot-password" className="underline">
            Refaire une demande
          </Link>
        </p>
      )}
    </div>
  );
}
