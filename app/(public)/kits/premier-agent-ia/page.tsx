import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Télécharger le kit Mon premier agent IA" };

export default async function KitPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source } = await searchParams;
  const campaign = ["mail", "article", "test"].includes(source ?? "") ? source : "direct";
  return <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-8">
    <p className="font-mono text-sm text-primary">AFROCODEURS / APPRENDRE EN FAISANT</p>
    <h1 className="text-3xl font-bold sm:text-5xl">Votre premier agent IA commence ici.</h1>
    <p className="text-lg text-muted-foreground">Un kit gratuit, en français, pour passer d’une idée à un agent testé sur votre ordinateur. Débutez avec une simulation sans compte ni frais d’API.</p>
    <section className="space-y-5 rounded-xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">Télécharger le kit complet</h2>
      <p>Archive ZIP · environ 239 Ko · Windows, macOS et Linux. La page de cours et votre progression restent sur votre ordinateur.</p>
      <form action={`/api/kits/premier-agent-ia?source=${campaign}`} method="post">
        <button type="submit" className={buttonVariants({ size: "lg" })}>Télécharger premier-agent-ia.zip</button>
      </form>
      <p className="text-sm text-muted-foreground">Si le téléchargement échoue, réessayez ou écrivez à <a className="underline" href="mailto:codescooper@gmail.com">codescooper@gmail.com</a>.</p>
    </section>
    <section className="space-y-3"><h2 className="text-2xl font-semibold">Après le téléchargement</h2>
      <ol className="list-decimal space-y-3 pl-6"><li>Extrayez entièrement le ZIP dans un dossier.</li><li>Ouvrez <strong>COMMENCER-ICI.html</strong> dans ce dossier.</li><li>Suivez l’installation de Python si nécessaire.</li><li>Windows : lancez <strong>DEMARRER-WINDOWS.bat</strong>. macOS/Linux : lancez <code>python3 serve.py</code> dans le terminal du dossier.</li><li>Choisissez votre parcours : 16 étapes pour débuter, ou 10 étapes si vous connaissez déjà le terminal. Le VPS est facultatif.</li></ol>
      <p>Gardez le même navigateur et exportez régulièrement votre progression depuis la page locale.</p>
    </section>
    <section className="space-y-3 border-t border-border pt-6"><h2 className="text-xl font-semibold">Comment le téléchargement est suivi</h2>
      <p className="text-sm text-muted-foreground">Le bouton enregistre la date, la source du lien (mail, article ou accès direct), le site référent sans ses paramètres, la famille du navigateur, le système, le type d’appareil, la version du kit, la taille servie et les erreurs. Ces informations techniques ne sont pas toujours exactes. Aucun cookie de suivi, adresse IP, adresse email ou identifiant individuel n’est enregistré par ce dispositif.</p>
      <p className="text-sm text-muted-foreground">Ces événements sont réservés à l’administration AfroCodeurs et déclenchent une notification regroupée au plus une fois par minute. Ils sont consultables sur 90 jours et les événements plus anciens sont purgés au téléchargement suivant. Une demande servie ne prouve pas que le fichier a été enregistré, ouvert ou utilisé. Les demandes répétées et certains robots peuvent être comptés. Votre progression locale n’est pas envoyée au site. Contact : codescooper@gmail.com.</p>
    </section>
    <Link className="inline-block text-primary underline" href="/knowledge/votre-premier-agent-ia-avec-afrocodeurs-de-l-idee-aux-premiers-tests">Lire le tutoriel illustré et rejoindre la communauté →</Link>
  </div>;
}
