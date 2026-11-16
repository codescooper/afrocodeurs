import { ActionForm } from "@/components/shared/action-form";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberUpdatePagination } from "@/features/member-sources/pagination";
import { sourceAction } from "@/features/member-sources/actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Kit de connexion" };
const input = "w-full rounded-lg border p-3 bg-background text-foreground";
function Action({operation,id,children}:{operation:string;id:string;children:React.ReactNode}) {
  return <ActionForm action={sourceAction}><input type="hidden" name="operation" value={operation}/><input type="hidden" name="id" value={id}/><button className="rounded-lg border px-4 py-2 hover:bg-muted">{children}</button></ActionForm>;
}
export default async function SourcesPage({searchParams}:{searchParams:Promise<{error?:string;saved?:string;page?:string}>}) {
  const session = await auth();
  if (!session?.user) return <Link href="/login">Se connecter</Link>;
  const query = await searchParams;
  const owner = { userId: session.user.id };
  const total = await db.memberUpdate.count({ where: owner });
  const pagination = memberUpdatePagination(query.page, total);
  const [sources, items] = await Promise.all([
    db.memberSource.findMany({where:owner,orderBy:{consentAt:"desc"}}),
    db.memberUpdate.findMany({where:owner,orderBy:[{createdAt:"desc"},{id:"desc"}],take:pagination.take,skip:pagination.skip}),
  ]);
  return <main className="mx-auto max-w-4xl space-y-8 p-6">
    <header><p className="text-sm text-muted-foreground">AFROCODEURS · VOS PROJETS, VOTRE CHOIX</p><h1 className="text-3xl font-bold">Kit de connexion</h1><p>Rassemblez vos nouveautés, prévisualisez-les puis choisissez celles à publier.</p><Link className="underline" href="/members-feed">Voir le fil public</Link> · <Link className="underline" href="/kit-connexion">Guide et exemples</Link></header>
    {query.error && <p role="alert" className="rounded-lg border border-red-500 p-4">{query.error.slice(0,300)}</p>}
    {query.saved && <p role="status">Modification enregistrée.</p>}
    <section className="rounded-xl border p-5 space-y-4"><h2 className="text-xl font-semibold">Connecter une source publique</h2><ActionForm action={sourceAction} className="space-y-3"><input type="hidden" name="operation" value="add"/>
      <label className="block">Type<select className={input} name="kind"><option value="feed">RSS, Atom ou JSON Feed</option><option value="github">Dépôt GitHub public (versions publiées)</option></select></label>
      <label className="block">Adresse HTTPS<input className={input} type="url" name="url" required placeholder="https://mon-site.example/feed.xml" maxLength={2048}/></label>
      <label className="flex gap-2"><input type="checkbox" name="consent" required/>J’autorise Afrocodeurs à importer cette source publique et je dispose des droits nécessaires. Chaque nouveauté reste privée jusqu’à ma validation.</label>
      <button className="rounded-lg bg-primary text-primary-foreground px-5 py-3">Connecter et prévisualiser</button>
    </ActionForm><p className="text-sm text-muted-foreground">Maximum 10 sources. Aucun lien de votre profil n’est connecté automatiquement. Les nouvelles entrées restent en aperçu privé, même après une synchronisation automatique.</p></section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Mes sources</h2>{!sources.length && <p>Aucune source connectée.</p>}{sources.map(s=><article key={s.id} className="rounded-xl border p-4 space-y-2"><p className="break-all">{s.url}</p><p className="text-sm">Dernière vérification : {s.lastCheckedAt?.toLocaleString("fr-FR") || "jamais"}</p>{s.lastError && <p role="alert">{s.lastError}</p>}<div className="flex gap-3"><Action operation="refresh" id={s.id}>Actualiser</Action><Action operation="remove" id={s.id}>Retirer la source et ses publications</Action></div></article>)}</section>
    <details className="rounded-xl border p-5"><summary className="cursor-pointer font-semibold">Ajouter manuellement un projet ou une actualité</summary><ActionForm action={sourceAction} className="mt-4 space-y-3"><input type="hidden" name="operation" value="manual"/><label className="block">Titre<input className={input} name="title" required maxLength={200}/></label><label className="block">Lien<input className={input} type="url" name="url" required maxLength={2048}/></label><label className="block">Résumé<textarea className={input} name="summary" required maxLength={2000}/></label><button className="rounded-lg border p-3">Enregistrer en aperçu privé</button></ActionForm></details>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Aperçus et publications</h2><p>Seules les fiches que vous publiez sont visibles. Le contenu importé reste du texte, sans exécution de code.</p>{!items.length && <p>Vos premières nouveautés apparaîtront ici.</p>}{items.map(item=><article key={item.id} className="rounded-xl border p-5 space-y-3"><span className="text-sm">{item.approvedAt ? "Publié" : "Aperçu privé"}</span><h3 className="font-semibold">{item.title}</h3><p className="whitespace-pre-wrap break-words">{item.summary}</p><a className="underline break-all" href={item.url} target="_blank" rel="noopener noreferrer nofollow">Consulter la source</a><Action operation={item.approvedAt ? "hide" : "publish"} id={item.id}>{item.approvedAt ? "Retirer du fil public" : "Valider et publier"}</Action></article>)}<nav aria-label="Pages des aperçus et publications" className="flex flex-wrap items-center gap-4">
      {pagination.page > 1 && <Link className="underline" href={`/dashboard/sources?page=${pagination.page - 1}`}>Page précédente</Link>}
      <span>Page {pagination.page} sur {pagination.pages} · {total} fiches</span>
      {pagination.page < pagination.pages && <Link className="underline" href={`/dashboard/sources?page=${pagination.page + 1}`}>Page suivante</Link>}
    </nav></section>
  </main>;
}
