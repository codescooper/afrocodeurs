"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { socialProviderConfig } from "@/lib/oauth-config";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function socialSignInAction(formData: FormData) {
  const provider = formData.get("provider");
  const enabled = socialProviderConfig().find(({ id }) => id === provider);
  if (!enabled) redirect("/login?error=ProviderUnavailable");
  const session = await auth();
  const linking = formData.get("intent") === "link";
  if (linking && !session?.user?.isEmailVerified) redirect("/dashboard/settings?error=EmailNotVerified");
  // Visiting /login while signed in must not silently associate a new identity.
  if (session?.user && !linking) redirect("/dashboard");
  const ip = await clientIp();
  if (!rateLimit(`oauth:${ip}`, 10, 5 * 60 * 1000).ok) redirect("/login?error=RateLimit");
  try {
    await signIn(enabled.id, { redirectTo: linking ? "/dashboard/settings" : "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login?error=OAuthSignin");
    throw error;
  }
}
