"use server";

import { db } from "@/lib/db";
import { guard } from "@/lib/guard";

export type EngineState = {
  step: number;
  inventory: string[];
  message: string;
  terminal: string[];
  completionCode?: string;
};

const INITIAL_MESSAGE = "Le soleil décline sur l’atelier. Explorez la scène.";

export async function playChallengeAction(previous: EngineState, formData: FormData): Promise<EngineState> {
  const g = await guard({ permission: "challenge:solve", verified: true });
  if (!g.ok) return { ...previous, message: g.error };
  const challengeId = formData.get("challengeId");
  const event = formData.get("event");
  const command = String(formData.get("command") ?? "").trim().toLowerCase();
  if (typeof challengeId !== "string") return { ...previous, message: "Défi introuvable." };

  const challenge = await db.challenge.findUnique({ where: { id: challengeId }, select: { status: true, mode: true, closeAt: true, completionCode: true } });
  if (!challenge || challenge.status !== "PUBLISHED" || challenge.mode !== "PIXEL_TERMINAL" || (challenge.closeAt && challenge.closeAt <= new Date())) return { ...previous, message: "Cette aventure n’est pas ouverte." };

  const progress = await db.challengeProgress.upsert({ where: { challengeId_userId: { challengeId, userId: g.user.id } }, create: { challengeId, userId: g.user.id }, update: {} });
  let step = progress.step;
  let inventory = progress.inventory;
  let message = INITIAL_MESSAGE;
  const terminal = [...previous.terminal].slice(-8);
  let completionCode: string | undefined;

  if (event === "inspect_baobab") {
    if (step === 0) step = 1;
    message = "Sous l’écorce, trois chiffres sont gravés : 2 · 2 · 5.";
  } else if (event === "take_usb") {
    if (step < 1) message = "La cachette résiste. Le baobab porte peut-être un indice.";
    else { step = Math.max(step, 2); inventory = inventory.includes("Clé solaire") ? inventory : [...inventory, "Clé solaire"]; message = "Vous récupérez une étrange clé solaire."; }
  } else if (event === "activate_solar") {
    if (!inventory.includes("Clé solaire")) message = "Le panneau n’a aucun connecteur compatible.";
    else { step = Math.max(step, 3); message = "Le panneau s’oriente vers le soleil. L’atelier retrouve de l’énergie."; }
  } else if (event === "boot_computer") {
    if (step < 3) message = "L’écran reste noir : aucune énergie.";
    else { step = Math.max(step, 4); message = "L’ordinateur démarre. Le terminal est maintenant accessible."; }
  } else if (event === "terminal") {
    if (step < 4) return { ...previous, step, inventory, message: "Le terminal est hors ligne.", terminal };
    terminal.push(`$ ${command}`);
    if (command === "help") terminal.push("Commandes : ls, mount /dev/usb, cat <fichier>, login <nom> <mot-de-passe>");
    else if (command === "ls") terminal.push(step >= 7 ? "flag.txt  journal.log  /mnt/usb" : "journal.log  /dev/usb");
    else if (command === "mount /dev/usb" && inventory.includes("Clé solaire")) { step = Math.max(step, 5); terminal.push("/dev/usb monté dans /mnt/usb"); }
    else if (command === "cat /mnt/usb/access.txt" && step >= 5) { step = Math.max(step, 6); terminal.push("utilisateur=maker", "indice_mot_de_passe=ubuntu+[gravure du baobab]"); }
    else if (command === "login maker ubuntu225" && step >= 6) { step = Math.max(step, 7); terminal.push("Accès accordé. Bienvenue, maker."); }
    else if (command === "cat flag.txt" && step >= 7) { step = 8; completionCode = challenge.completionCode ?? undefined; terminal.push(completionCode ? `FLAG=${completionCode}` : "Flag indisponible : contactez un modérateur."); }
    else terminal.push("Commande inconnue ou condition non remplie. Essayez help.");
    message = "Le terminal attend votre prochaine commande.";
  }

  await db.challengeProgress.update({ where: { id: progress.id }, data: { step, inventory, completedAt: step >= 8 ? new Date() : null } });
  return { step, inventory, message, terminal, completionCode };
}
