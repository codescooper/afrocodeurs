import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OpportunityForm } from "@/features/opportunities/opportunity-form";

export const metadata = { title: "Publier une opportunité" };

export default async function NewOpportunityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <div className="mx-auto w-full max-w-3xl px-4 py-12">
    <h1 className="text-3xl font-bold tracking-tight">Publier une opportunité</h1>
    <p className="mt-2 text-muted-foreground">Donnez toutes les informations nécessaires pour aider les membres à décider et à candidater.</p>
    <div className="mt-8"><OpportunityForm /></div>
  </div>;
}
