import type { JWT } from "next-auth/jwt";

/**
 * Garde le JWT de session compact. Auth.js y ajoute par défaut le nom, l'email
 * et surtout l'image du profil ; une image historique encodée en data URL peut
 * alors fragmenter le cookie jusqu'à provoquer un HTTP 431.
 */
export function minimizeAuthToken(token: JWT): JWT {
  const { name: _name, email: _email, picture: _picture, ...minimal } = token;
  return minimal;
}
