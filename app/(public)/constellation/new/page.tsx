import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { VentureForm } from "@/features/constellation/venture-form";
import { VerifyEmailBanner } from "@/features/auth/verify-email-banner";
import { pendingFields } from "@/features/constellation/pending-changes";
export const metadata = { robots: { index: false, follow: false }, title: "Présenter ma réalisation" };
export default async function NewVenturePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const session = await auth(); if (!session?.user) redirect("/login");
  const { edit } = await searchParams;
  const venture = edit ? await db.communityVenture.findFirst({ where: { id: edit, ownerId: session.user.id } }) : null;
  if (edit && !venture) notFound();
  const projects = await db.project.findMany({ where: { createdById: session.user.id }, select: { id: true, name: true }, take: 100 });
  const proposed = pendingFields(venture?.pendingChanges);
  return <div className="mx-auto max-w-2xl space-y-6 px-4 py-10"><Link href="/dashboard/constellation" className="text-sm underline">Mes réalisations</Link><h1 className="text-2xl font-bold">{venture ? "Modifier ma fiche" : "Présenter ma réalisation"}</h1>{venture?.status === "PUBLISHED" && <p className="text-sm">La version publiée reste visible pendant l’examen de tes modifications.</p>}{!session.user.isEmailVerified ? <VerifyEmailBanner /> : venture?.status === "SUSPENDED" ? <p role="alert">Cette fiche est suspendue. Contacte la modération.</p> : <VentureForm venture={venture ? { ...venture, ...proposed } : undefined} projects={projects} />}</div>;
}
