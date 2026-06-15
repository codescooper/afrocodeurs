import { LegalShell } from "@/components/shared/legal-shell";

export const metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalShell title="Mentions légales">
      <h2>Éditeur</h2>
      <p>
        AfroCodeurs <em>[raison sociale / statut à compléter]</em>
        <br />
        <em>[adresse à compléter]</em>
        <br />
        Contact : <a href="mailto:contact@afrocodeurs.org">
        contact@afrocodeurs.org</a>
      </p>

      <h2>Directeur de la publication</h2>
      <p>
        <em>[nom à compléter]</em>
      </p>

      <h2>Hébergement</h2>
      <p>
        <em>[hébergeur à compléter — ex. Vercel Inc., 340 S Lemon Ave #4133,
        Walnut, CA 91789, USA]</em>
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Le code source d&apos;AfroCodeurs est open source, distribué sous licence
        MIT :{" "}
        <a
          href="https://github.com/codescooper/afrocodeurs"
          target="_blank"
          rel="noreferrer"
        >
          github.com/codescooper/afrocodeurs
        </a>
        . Les contenus publiés (ressources, réponses…) restent la propriété de
        leurs auteurs respectifs.
      </p>

      <h2>Signalement</h2>
      <p>
        Pour signaler un contenu, utilise le bouton « Signaler » présent sur les
        contenus publics, ou écris à{" "}
        <a href="mailto:abuse@afrocodeurs.org">abuse@afrocodeurs.org</a>.
      </p>
    </LegalShell>
  );
}
