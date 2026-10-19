import { Code2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { socialProviderConfig } from "@/lib/oauth-config";
import { socialSignInAction } from "./social-actions";

export function SocialButtons({ linking = false, linked = [], disabled = false }: {
  linking?: boolean;
  linked?: string[];
  disabled?: boolean;
}) {
  const providers = socialProviderConfig();
  if (!providers.length) return null;
  return <div className="flex flex-col gap-3">
    {providers.map(({ id }) => {
      const connected = linked.includes(id);
      const label = id === "google" ? "Google" : "GitHub";
      const Icon = id === "github" ? Code2 : LogIn;
      return <form action={socialSignInAction} key={id}>
        <input type="hidden" name="provider" value={id} />
        {linking && <input type="hidden" name="intent" value="link" />}
        <Button type="submit" variant="outline" className="w-full" disabled={disabled || connected}>
          <Icon aria-hidden="true" />
          {connected ? `${label} associé` : linking ? `Associer ${label}` : `Continuer avec ${label}`}
        </Button>
      </form>;
    })}
  </div>;
}
