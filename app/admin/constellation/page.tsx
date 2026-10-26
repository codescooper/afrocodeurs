import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { VentureActionForm } from "@/features/constellation/action-form";
export const metadata = { title: "Validation Constellation" };
export default async function ReviewConstellationPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();
  if (!session?.user?.isEmailVerified || !can(session.user.role, "content:validate")) redirect("/dashboard");
  const params = await searchParams;
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const rows = await db.communityVenture.findMany({ where: { status: "PENDING" }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip: (page - 1) * 20, take: 21, include: { owner: { select: { username: true } } } });
  return <div className="space-y-6">
    <Link href="/admin" className="text-sm underline">Administration</Link>
    <h1 className="text-2xl font-bold">Validation Constellation</h1>
    {!rows.length && <p>Aucune fiche en attente.</p>}
    <div className="divide-y divide-border">{rows.slice(0, 20).map((v) => {
      const own = v.ownerId === session.user.id;
      const independentRequired = own && session.user.role !== "ADMIN";
      return <article key={v.id} className="space-y-4 py-6">
        <h2 className="text-lg font-semibold"><a href={`/constellation/${v.slug}`} target="_blank" rel="noopener noreferrer" className="underline">{v.name}</a></h2>
        <p className="text-sm text-muted-foreground">Déclaré par @{v.owner.username} · version {v.revision}</p>
        <p>{v.summary}</p><p className="whitespace-pre-wrap text-sm">{v.description}</p>
        <a href={v.websiteUrl} target="_blank" rel="noopener noreferrer" className="block break-all text-sm underline">{v.websiteUrl}</a>
        {own && <p className="text-sm text-muted-foreground">{independentRequired ? "Ta fiche doit être examinée par une autre personne de la modération." : "Tu es propriétaire de cette fiche. Ton auto-validation administrateur sera inscrite dans le journal."}</p>}
        {!independentRequired && <div className="grid gap-4 sm:grid-cols-2">
          <VentureActionForm fields={{ id: v.id, revision: String(v.revision), status: "PUBLISHED", note: "" }} kind="review" label={own ? "Publier ma fiche" : "Publier la fiche"}>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" required />Présentation et lien public examinés. La publication ne certifie pas la propriété du service.</label>
          </VentureActionForm>
          <VentureActionForm fields={{ id: v.id, revision: String(v.revision), status: "ARCHIVED" }} kind="review" label="Demander des ajustements">
            <label className="grid gap-2 text-sm">Motif<textarea className="rounded-md border border-border bg-background p-2" name="note" required minLength={10} maxLength={500} rows={3} /></label>
          </VentureActionForm>
        </div>}
      </article>;
    })}</div>
    <nav className="flex gap-5" aria-label="Pages des fiches à valider">{page > 1 && <Link href={`/admin/constellation?page=${page - 1}`}>Précédente</Link>}{rows.length > 20 && <Link href={`/admin/constellation?page=${page + 1}`}>Suivante</Link>}</nav>
  </div>;
}
