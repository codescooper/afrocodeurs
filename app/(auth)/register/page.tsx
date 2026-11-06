import { RegisterForm } from "@/features/auth/register-form";
import { getSignupConfig } from "@/lib/signup-config";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  let config;
  try {
    config = getSignupConfig();
  } catch {
    console.error("[signup] invalid anti-bot configuration");
  }
  if (!config) return <div role="alert" className="space-y-3">
      <h1 className="text-xl font-bold">Inscription temporairement indisponible</h1>
      <p>La vérification de sécurité rencontre un problème. Réessaie plus tard, sans changer tes identifiants.</p>
      <Link href="/contact" className="underline">Contacter AfroCodeurs</Link>
  </div>;
  return <RegisterForm {...config} />;
}
