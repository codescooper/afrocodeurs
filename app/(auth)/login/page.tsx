import { LoginForm } from "@/features/auth/login-form";
import { SocialButtons } from "@/features/auth/social-buttons";
import { socialAuthError } from "@/lib/oauth-config";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string; passwordChanged?: string }>;
}) {
  const { error, passwordChanged } = await searchParams;
  const message = socialAuthError(error);
  return <div className="flex flex-col gap-6">
    {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    {passwordChanged === "1" && <p role="status" className="text-sm">Mot de passe mis à jour. Reconnecte-toi ; les anciennes sessions ont été fermées.</p>}
    <LoginForm />
    <SocialButtons />
  </div>;
}
