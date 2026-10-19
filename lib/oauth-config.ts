export const SOCIAL_PROVIDERS = ["google", "github"] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export function socialProviderConfig(env: Record<string, string | undefined> = process.env) {
  return SOCIAL_PROVIDERS.flatMap((id) => {
    const prefix = id.toUpperCase();
    const legacyId = env[`${prefix}_CLIENT_ID`]?.trim();
    const legacySecret = env[`${prefix}_CLIENT_SECRET`]?.trim();
    const useLegacy = Boolean(legacyId && legacySecret);
    const clientId = useLegacy ? legacyId : env[`AUTH_${prefix}_ID`]?.trim();
    const clientSecret = useLegacy ? legacySecret : env[`AUTH_${prefix}_SECRET`]?.trim();
    return clientId && clientSecret ? [{ id, clientId, clientSecret }] : [];
  });
}

export function socialAuthError(code: string | undefined): string | null {
  if (!code) return null;
  if (code === "OAuthAccountNotLinked" || code === "AccountNotLinked") {
    return "Cette adresse est déjà associée à un compte. Connecte-toi avec ta méthode habituelle, puis associe Google ou GitHub dans les paramètres.";
  }
  if (code === "EmailNotVerified") return "Confirme ton adresse auprès du fournisseur avant de continuer.";
  if (code === "EmailRequired") return "Une adresse email est nécessaire. Ajoute-la à ton compte fournisseur ou inscris-toi par email.";
  if (code === "ProviderUnavailable") return "Ce mode de connexion n'est pas disponible pour le moment.";
  if (code === "RateLimit") return "Trop de tentatives. Patiente quelques minutes.";
  return "La connexion externe n'a pas abouti. Réessaie ou utilise ton email.";
}
