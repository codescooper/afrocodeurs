import Link from "next/link";

import { SocialButtons } from "@/features/auth/social-buttons";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Rejoindre AfroCodeurs</h1>
        <p className="text-sm text-muted-foreground">
          Des problèmes aux solutions, ensemble.
        </p>
      </div>

      <SocialButtons />

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-foreground underline">
          Connexion
        </Link>
      </p>
    </div>
  );
}
