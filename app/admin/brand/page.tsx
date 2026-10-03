import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getBrandSettings } from "@/features/brand/settings";
import { updateBrandSettingsAction } from "@/features/brand/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { BrandCatalogAdmin } from "@/components/brand/catalog-admin";
export const metadata={title:"Brand Hub · Administration"};
const field="rounded-md border border-border bg-background px-3 py-2 text-sm";
export default async function AdminBrandPage(){
 const session=await auth();if(!session?.user || !can(session.user.role,"system:manage")) redirect("/admin");
 const b=await getBrandSettings();
 return <div className="grid gap-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Identité</p><h1 className="mt-1 text-3xl font-bold">Brand Hub</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Modifie les contenus autorisés de la charte. La structure et les garde-fous restent contrôlés par le produit.</p></div><Link href="/brand" target="_blank" className={buttonVariants({variant:"outline"})}>Voir la charte publique</Link></div>
 <form action={updateBrandSettingsAction} className="grid gap-7">
  <Section title="Fondations"><Grid><F n="version" l="Version" v={b.version}/><F n="tagline" l="Signature" v={b.tagline}/><F n="mantra" l="Mantra" v={b.mantra}/></Grid><TA n="intro" l="Introduction" v={b.intro}/></Section>
  <Section title="Palette"><div className="grid gap-4 sm:grid-cols-3">{[["gold","Or",b.gold],["black","Noir",b.black],["green","Vert",b.green],["ivory","Ivoire",b.ivory],["night","Night",b.night],["stone","Stone",b.stone]].map(([n,l,v])=><label key={n} className="grid gap-2 text-sm font-medium"><span>{l}</span><div className="flex gap-2"><span className="size-10 shrink-0 rounded-md border" style={{background:v}}/><input name={n} defaultValue={v} pattern="^#[0-9A-Fa-f]{6}$" required className={field+" min-w-0 flex-1 font-mono"}/></div></label>)}</div></Section>
  <Section title="Langage visuel"><F n="visualPrinciple" l="Principe" v={b.visualPrinciple}/><TA n="visualGuidance" l="Direction" v={b.visualGuidance}/></Section>
  <Section title="Guides métier"><TA n="graphicGuidance" l="Graphiste / DA" v={b.graphicGuidance}/><TA n="motionGuidance" l="Motion designer" v={b.motionGuidance}/><TA n="devGuidance" l="Développeur" v={b.devGuidance}/><TA n="socialGuidance" l="Social / Community" v={b.socialGuidance}/></Section>
  <Section title="Exemple Webinar"><Grid><F n="webinarLabel" l="Label" v={b.webinarLabel}/><F n="webinarMeta" l="Date / meta" v={b.webinarMeta}/></Grid><TA n="webinarTitle" l="Titre (une ligne par niveau)" v={b.webinarTitle}/></Section>
  <Section title="Ressources externes"><Grid><F n="figmaUrl" l="Figma" v={b.figmaUrl??""} type="url"/><F n="canvaUrl" l="Canva" v={b.canvaUrl??""} type="url"/><F n="assetsUrl" l="Brand assets / Drive" v={b.assetsUrl??""} type="url"/></Grid></Section>
  <div className="sticky bottom-4 flex justify-end"><Button type="submit" size="lg">Enregistrer la charte</Button></div>
 </form><BrandCatalogAdmin/></div>
}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="grid gap-4 rounded-xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">{title}</h2>{children}</section>}
function Grid({children}:{children:React.ReactNode}){return <div className="grid gap-4 md:grid-cols-3">{children}</div>}
function F({n,l,v,type="text"}:{n:string;l:string;v:string;type?:string}){return <label className="grid gap-1 text-sm font-medium">{l}<input name={n} type={type} defaultValue={v} className={field}/></label>}
function TA({n,l,v}:{n:string;l:string;v:string}){return <label className="grid gap-1 text-sm font-medium">{l}<textarea name={n} defaultValue={v} rows={3} className={field}/></label>}
