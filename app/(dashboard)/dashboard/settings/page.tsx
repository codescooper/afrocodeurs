import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  AccountForm,
  PasswordForm,
} from "@/features/settings/settings-forms";
import { signOutAction } from "@/features/settings/actions";
import { USER_ROLE_LABELS } from "@/features/admin/constants";
import { SocialButtons } from "@/features/auth/social-buttons";
import { socialProviderConfig } from "@/lib/oauth-config";

export const metadata = { title: "Paramètres" };

/** Réglages du compte : identité, nom affiché, mot de passe, déconnexion. */
export default async function SettingsPage() {
  const session = await auth();
  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    select: {
      name: true,
      username: true,
      email: true,
      role: true,
      passwordHash: true,
      emailVerified: true,
      accounts: { select: { provider: true } },
    },
  });

  if (!user) return null;

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Gérez votre compte AfroCodeurs.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Compte</h2>
        <dl className="rounded-lg border border-border bg-background p-4 text-sm">
          <div className="flex justify-between py-1">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-muted-foreground">Nom d&apos;utilisateur</dt>
            <dd>@{user.username}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-muted-foreground">Rôle</dt>
            <dd>{USER_ROLE_LABELS[user.role]}</dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Identité</h2>
        <AccountForm defaultName={user.name ?? ""} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Mot de passe</h2>
        <PasswordForm hasPassword={Boolean(user.passwordHash)} />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        {socialProviderConfig().length > 0 && <div className="flex flex-col gap-3">
          <h2 className="font-semibold">Comptes associés</h2>
          {!user.emailVerified && <p className="text-sm text-muted-foreground">Confirme ton email AfroCodeurs avant d&apos;associer un compte externe.</p>}
          <SocialButtons linking linked={user.accounts.map(({ provider }) => provider)} disabled={!user.emailVerified} />
        </div>}
        <h2 className="font-semibold">Session</h2>
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            Se déconnecter
          </Button>
        </form>
      </section>
    </div>
  );
}
