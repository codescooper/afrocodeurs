import Link from "next/link";

import { SocialButtons } from "@/features/auth/social-buttons";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Ravi de vous revoir parmi les AfroMakers.
        </p>
      </div>

      <SocialButtons />

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium text-foreground underline">
          Rejoindre
        </Link>
      </p>
    </div>
  );
}
