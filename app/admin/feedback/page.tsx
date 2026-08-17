import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { triageFeedbackAction, updateDevelopmentGoalAction } from "@/features/product-feedback/actions";

const CATEGORY = { BUG: "Bug", MISSING_FEATURE: "Fonctionnalité manquante", UX: "Expérience", CONTENT: "Contenu", PERFORMANCE: "Performance", OTHER: "Autre" } as const;
const STATUS = { NEW: "Nouvelle", REVIEWING: "En analyse", ACCEPTED: "Acceptée", REJECTED: "Rejetée", CONVERTED: "Convertie en objectif" } as const;

export default async function FeedbackAdminPage() {
  const session = await auth();
  if (!can(session?.user?.role, "content:manage")) redirect("/");
  const feedback = await db.productFeedback.findMany({ include: { author: { select: { username: true } }, developmentGoal: { select: { id: true, status: true } } }, orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }] });
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Demandes produit</h1><p className="text-sm text-muted-foreground">Analyse automatique indicative, décision finale humaine.</p></div><Link href="/updates#roadmap" className="text-sm font-medium underline">Voir les objectifs publics</Link></div>
      <ul className="mt-6 grid gap-4">{feedback.map((item) => <li key={item.id} className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-muted px-2 py-1">{CATEGORY[item.category]}</span><span className="rounded-full bg-primary/15 px-2 py-1">Priorité {item.priorityScore}/5</span><span className="rounded-full bg-muted px-2 py-1">{STATUS[item.status]}</span></div><h2 className="mt-2 font-semibold">{item.title}</h2><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p></div><span className="text-xs text-muted-foreground">{item.submittedByLabel ?? (item.author ? `@${item.author.username}` : "Communauté")}</span></div>
        <p className="mt-3 rounded-md bg-muted p-3 text-xs">{item.analysis}</p>{item.sourceUrl && <Link href={item.sourceUrl} className="mt-2 inline-block text-xs underline">Voir le contexte</Link>}
        {!item.developmentGoal && item.status !== "REJECTED" && <div className="mt-4 flex flex-wrap gap-2"><TriageForm id={item.id} decision="review" label="Analyser" outline/><TriageForm id={item.id} decision="convert" label="Valider comme objectif"/><TriageForm id={item.id} decision="reject" label="Rejeter" destructive/></div>}
        {item.developmentGoal && <form action={updateDevelopmentGoalAction} className="mt-4 flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={item.developmentGoal.id}/><label className="text-xs font-medium">Avancement</label><select name="status" defaultValue={item.developmentGoal.status} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"><option value="PLANNED">Planifié</option><option value="IN_PROGRESS">En cours</option><option value="SHIPPED">Livré</option><option value="CANCELLED">Annulé</option></select><Button size="sm" variant="outline">Mettre à jour</Button></form>}
      </li>)}</ul>
      {feedback.length === 0 && <p className="mt-8 text-center text-muted-foreground">Aucune demande pour le moment.</p>}
    </div>
  );
}

function TriageForm({ id, decision, label, outline, destructive }: { id: string; decision: string; label: string; outline?: boolean; destructive?: boolean }) {
  return <form action={triageFeedbackAction}><input type="hidden" name="id" value={id}/><input type="hidden" name="decision" value={decision}/><Button size="sm" variant={destructive ? "destructive" : outline ? "outline" : "primary"}>{label}</Button></form>;
}
