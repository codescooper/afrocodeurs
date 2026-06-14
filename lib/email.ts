import "server-only";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Envoie un email.
 * - Si `RESEND_API_KEY` est défini : envoi réel via l'API Resend (simple fetch,
 *   aucune dépendance). `EMAIL_FROM` doit être un expéditeur autorisé.
 * - Sinon : mode dev — l'email est journalisé dans la console (le lien magique
 *   est dans le corps), donc testable en local sans aucun fournisseur.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: EmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "AfroCodeurs <onboarding@resend.dev>";

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html, text: text ?? undefined }),
      });
      if (!res.ok) {
        console.error(
          "[email] envoi Resend échoué:",
          res.status,
          await res.text().catch(() => ""),
        );
      }
    } catch (err) {
      console.error("[email] erreur d'envoi:", err);
    }
    return;
  }

  // Mode dev — aucun fournisseur configuré.
  const body = text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  console.log(
    `\n📧 [EMAIL · mode dev — définis RESEND_API_KEY pour un envoi réel]\n   À     : ${to}\n   Sujet : ${subject}\n   ${body}\n`,
  );
}
