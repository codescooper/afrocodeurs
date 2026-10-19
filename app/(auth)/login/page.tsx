import { LoginForm } from "@/features/auth/login-form";
import { SocialButtons } from "@/features/auth/social-buttons";
import { socialAuthError } from "@/lib/oauth-config";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = socialAuthError(error);
  return <div className="flex flex-col gap-6">
    {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    <LoginForm />
    <SocialButtons />
  </div>;
}
