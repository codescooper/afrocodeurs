import { LegalShell } from "@/components/shared/legal-shell";

export const metadata = { title: "Conditions d'utilisation" };

export default function ConditionsPage() {
  return (
    <LegalShell title="Conditions d'utilisation">
      <p>
        En utilisant AfroCodeurs, tu acceptes ces conditions. Lis-les
        attentivement.
      </p>

      <h2>1. Compte</h2>
      <p>
        Tu es responsable de la confidentialité de ton mot de passe et de
        l&apos;activité de ton compte. Donne des informations exactes et garde
        ton adresse email à jour.
      </p>

      <h2>2. Usage acceptable</h2>
      <p>Tu t&apos;engages à ne pas :</p>
      <ul>
        <li>publier de contenu illégal, haineux, harcelant ou trompeur ;</li>
        <li>spammer, usurper une identité ou perturber le service ;</li>
        <li>plagier : cite tes sources et respecte les licences.</li>
      </ul>
      <p>
        La communauté suit un{" "}
        <a
          href="https://github.com/codescooper/afrocodeurs/blob/main/CODE_OF_CONDUCT.md"
          target="_blank"
          rel="noreferrer"
        >
          code de conduite
        </a>{" "}
        ; son non-respect peut entraîner des sanctions.
      </p>

      <h2>3. Ton contenu</h2>
      <p>
        Tu restes propriétaire de ce que tu publies. En le publiant, tu accordes
        à AfroCodeurs une licence non exclusive pour l&apos;afficher et le
        diffuser sur la plateforme. Dans l&apos;esprit{" "}
        <strong>« Build Before Consume »</strong>, les ressources de
        connaissance sont destinées à être partagées avec la communauté.
      </p>

      <h2>4. Modération</h2>
      <p>
        Nous pouvons modérer, masquer ou supprimer du contenu, et suspendre des
        comptes qui enfreignent ces conditions, afin de protéger la communauté.
      </p>

      <h2>5. Disponibilité &amp; responsabilité</h2>
      <p>
        Le service est fourni « en l&apos;état », sans garantie de disponibilité
        continue. Dans les limites permises par la loi, AfroCodeurs ne saurait
        être tenu responsable des dommages indirects liés à l&apos;usage du
        service.
      </p>

      <h2>6. Modifications</h2>
      <p>
        Ces conditions peuvent évoluer. Les changements importants seront
        signalés sur la plateforme.
      </p>

      <h2>7. Droit applicable</h2>
      <p>
        Les présentes conditions sont régies par le droit applicable au siège de
        l&apos;éditeur <em>[à compléter]</em>.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:contact@afrocodeurs.org">contact@afrocodeurs.org</a>
      </p>
    </LegalShell>
  );
}
