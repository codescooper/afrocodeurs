import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClaimReviewForm } from "@/features/solutions/claim-forms";
import { claimProofCode } from "@/features/solutions/catalog";

export const metadata = { title: "Demandes de gestion Atlas" };

export default async function AtlasClaimsPage() {
  const user = (await auth())?.user;
  if (user?.role !== "ADMIN") redirect("/dashboard");
  const claims = await db.solutionClaim.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 100, include: { solution: { select: { name: true, slug: true, repositoryUrl: true } }, user: { select: { username: true } } } });
  return <><h1 className="text-2xl font-semibold">Demandes de gestion de l’Atlas</h1><p className="mt-3 text-sm">Vérifiez le contrôle du dépôt ou du site officiel, pas seulement un nom ou un email. Ne téléchargez ni n’exécutez les fichiers fournis comme preuve. Les décisions ne transfèrent aucun droit de propriété intellectuelle.</p>{!claims.length && <p className="mt-6">Aucune demande en attente.</p>}<div className="mt-6 divide-y divide-border">{claims.map(claim => <section key={claim.id} className="space-y-4 py-6"><h2 className="font-semibold"><Link href={`/atlas/${claim.solution.slug}`} className="underline">{claim.solution.name}</Link> — @{claim.user.username}</h2><p className="whitespace-pre-wrap break-words text-sm">{claim.evidence}</p><p className="break-all text-sm">Code personnel à contrôler : <code>{claimProofCode(claim.id, claim.userId)}</code></p><ClaimReviewForm id={claim.id} self={claim.userId === user.id} /></section>)}</div>{claims.length === 100 && <p>Les 100 plus anciennes demandes sont affichées. Traitez-les pour voir la suite.</p>}</>;
}
