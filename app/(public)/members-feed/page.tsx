import Link from "next/link";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export const metadata = { title: "Les nouveautés des membres" };
export default async function MembersFeedPage() {
 const items = await db.memberUpdate.findMany({where:{approvedAt:{not:null}},orderBy:{approvedAt:"desc"},take:60,include:{user:{select:{name:true,username:true}}}});
 return <main className="max-w-4xl mx-auto p-6 space-y-6"><h1 className="text-3xl font-bold">Les nouveautés des membres</h1><p>Projets et actualités sélectionnés par leurs auteurs. Afrocodeurs relaie ces liens sans garantir les services externes.</p><Link className="underline" href="/dashboard/sources">Partager mes nouveautés</Link>{!items.length && <p>Les premières contributions arrivent bientôt.</p>}{items.map(i=><article className="border rounded-xl p-5 space-y-3" key={i.id}><p className="text-sm text-muted-foreground">{i.user.name || i.user.username} · {i.approvedAt?.toLocaleDateString("fr-FR")}</p><h2 className="text-xl font-semibold">{i.title}</h2><p className="whitespace-pre-wrap break-words">{i.summary}</p><a className="underline" href={i.url} target="_blank" rel="noopener noreferrer nofollow">Découvrir sur le site d’origine ↗</a></article>)}</main>;
}
