import { LegalShell } from "@/components/shared/legal-shell";

export const metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <LegalShell title="Politique de confidentialité">
      <p>
        AfroCodeurs respecte ta vie privée. Cette page explique quelles données
        nous collectons, pourquoi, et quels sont tes droits. Nous ne vendons
        aucune donnée personnelle.
      </p>

      <h2>Données que nous collectons</h2>
      <ul>
        <li>
          <strong>Compte</strong> : adresse email, nom d&apos;utilisateur, mot
          de passe (stocké haché, jamais en clair).
        </li>
        <li>
          <strong>Profil</strong> (facultatif) : nom, bio, pays, ville,
          compétences, langues, liens (GitHub, site…).
        </li>
        <li>
          <strong>Contenu</strong> que tu publies : questions, réponses,
          ressources, problèmes, solutions, commentaires.
        </li>
        <li>
          <strong>Données techniques</strong> : journaux serveur et adresse IP,
          utilisés pour la sécurité et la lutte contre les abus.
        </li>
      </ul>

      <h2>Pourquoi nous les utilisons</h2>
      <ul>
        <li>Fournir le service (compte, contributions, communautés).</li>
        <li>Sécurité, modération et prévention du spam.</li>
        <li>
          Notifications (in-app, email, et push si tu y as consenti dans tes
          préférences).
        </li>
      </ul>

      <h2>Base légale (RGPD)</h2>
      <p>
        Exécution du service que tu demandes (contrat), intérêt légitime
        (sécurité du site), et consentement (notifications push, retirable à
        tout moment).
      </p>

      <h2>Cookies</h2>
      <p>
        Nous utilisons uniquement des cookies <strong>nécessaires</strong> au
        fonctionnement (cookie de session pour te garder connecté·e). Aucun
        cookie publicitaire ni traceur tiers.
      </p>

      <h2>Partage des données</h2>
      <p>
        Le contenu que tu publies est <strong>public</strong> et visible par
        tous. Nous faisons appel à des prestataires techniques (envoi
        d&apos;emails, notifications push, hébergement) qui traitent les données
        strictement pour notre compte. Aucune revente.
      </p>

      <h2>Conservation</h2>
      <p>
        Tes données sont conservées tant que ton compte existe. À la suppression
        du compte, elles sont effacées (le contenu communautaire peut être
        anonymisé pour préserver la cohérence des échanges).
      </p>

      <h2>Tes droits</h2>
      <p>
        Tu disposes des droits d&apos;accès, de rectification, d&apos;effacement,
        de portabilité et d&apos;opposition. Pour les exercer, écris-nous à{" "}
        <a href="mailto:privacy@afrocodeurs.org">privacy@afrocodeurs.org</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Question sur tes données ? <a href="mailto:privacy@afrocodeurs.org">
        privacy@afrocodeurs.org</a>.
      </p>
    </LegalShell>
  );
}
