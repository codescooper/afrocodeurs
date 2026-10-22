import "server-only";
import { Prisma, type PrismaClient } from "@prisma/client";
import { canTransition, type MentorshipCommand } from "./validators";
import { categoryForType } from "@/features/notifications/constants";
import { sendPush } from "@/features/notifications/push";
export class MentorshipError extends Error {}
type Tx = Prisma.TransactionClient;
function fail(message: string): never { throw new MentorshipError(message); }
const pair = (a: string, b: string) => ({ OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] });
async function notice(tx: Tx, userId: string, title: string, queue: { userId: string; title: string }[]) {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { notificationOptOut: true } });
  const category = categoryForType("MENTORSHIP");
  if (!user || (category && user.notificationOptOut.includes(category))) return;
  await tx.notification.create({ data: { userId, type: "MENTORSHIP", title, body: "Consulte ton espace mentorat pour voir la mise à jour.", link: "/dashboard/mentorship" } });
  queue.push({ userId, title });
}
export async function runMentorship(db: PrismaClient, userId: string, command: MentorshipCommand): Promise<void> {
  // Serializable transactions protect capacity, blocks and competing decisions.
  for (let attempt = 0; attempt < 3; attempt++) {
    const pushAfterCommit: { userId: string; title: string }[] = [];
    try {
      await db.$transaction(async (tx) => {
        if (command.command === "offer") {
          const data = { title: command.title, description: command.description, topics: command.topics, languages: command.languages, availability: command.availability, capacity: command.capacity, active: command.active };
          const accepted = await tx.mentorshipRequest.count({ where: { offer: { mentorId: userId }, status: "ACCEPTED" } });
          if (data.capacity < accepted) fail("La capacité ne peut pas être inférieure aux suivis en cours.");
          await tx.mentorshipOffer.upsert({ where: { mentorId: userId }, create: { ...data, mentorId: userId }, update: data });
          return;
        }
        if (command.command === "block" || command.command === "unblock") {
          if (command.id === userId) fail("Tu ne peux pas te bloquer toi-même.");
          if (command.command === "unblock") {
            await tx.mentorshipBlock.deleteMany({ where: { blockerId: userId, blockedId: command.id } });
            return;
          }
          const other = await tx.user.findUnique({ where: { id: command.id }, select: { id: true } });
          if (!other) fail("Membre introuvable.");
          await tx.mentorshipBlock.upsert({ where: { blockerId_blockedId: { blockerId: userId, blockedId: command.id } }, create: { blockerId: userId, blockedId: command.id }, update: {} });
          await tx.mentorshipRequest.updateMany({ where: { status: { in: ["PENDING", "ACCEPTED"] }, OR: [{ menteeId: userId, offer: { mentorId: command.id } }, { menteeId: command.id, offer: { mentorId: userId } }] }, data: { status: "CANCELLED" } });
          return;
        }
        if (command.command === "request") {
          const offer = await tx.mentorshipOffer.findUnique({ where: { id: command.id }, include: { mentor: { select: { emailVerified: true } } } });
          if (!offer || !offer.active || offer.suspendedAt || !offer.mentor.emailVerified) fail("Cette offre n'est plus disponible.");
          if (offer.mentorId === userId) fail("Tu ne peux pas solliciter ta propre offre.");
          if (await tx.mentorshipBlock.findFirst({ where: pair(userId, offer.mentorId) })) fail("Ce mentorat n'est pas disponible.");
          if (await tx.mentorshipRequest.count({ where: { offerId: offer.id, status: "ACCEPTED" } }) >= offer.capacity) fail("Toutes les places sont prises.");
          if (await tx.mentorshipRequest.count({ where: { menteeId: userId, status: "PENDING" } }) >= 5) fail("Tu as déjà cinq demandes en attente.");
          if (await tx.mentorshipRequest.findUnique({ where: { offerId_menteeId: { offerId: offer.id, menteeId: userId } } })) fail("Tu as déjà envoyé une demande à ce mentor.");
          await tx.mentorshipRequest.create({ data: { offerId: offer.id, menteeId: userId, message: command.message } });
          await notice(tx, offer.mentorId, "Nouvelle demande de mentorat", pushAfterCommit);
          return;
        }
        const request = await tx.mentorshipRequest.findUnique({ where: { id: command.id }, include: { offer: true } });
        if (!request || (request.menteeId !== userId && request.offer.mentorId !== userId)) fail("Demande introuvable.");
        const isMentor = request.offer.mentorId === userId;
        if (!canTransition(request.status, command.status, isMentor)) fail("Cette décision n'est plus possible.");
        if (command.status === "ACCEPTED") {
          if (!request.offer.active || request.offer.suspendedAt) fail("Cette offre est suspendue ou en pause.");
          if (await tx.mentorshipBlock.findFirst({ where: pair(request.menteeId, request.offer.mentorId) })) fail("Ce mentorat n'est pas disponible.");
          if (await tx.mentorshipRequest.count({ where: { offerId: request.offerId, status: "ACCEPTED" } }) >= request.offer.capacity) fail("Toutes les places sont prises.");
        }
        const changed = await tx.mentorshipRequest.updateMany({ where: { id: request.id, status: request.status }, data: { status: command.status } });
        if (changed.count !== 1) fail("La demande a déjà été mise à jour.");
        await notice(tx, isMentor ? request.menteeId : request.offer.mentorId, "Mise à jour de ton mentorat", pushAfterCommit);
      }, { isolationLevel: "Serializable" });
      await Promise.all(pushAfterCommit.map((item) => sendPush(item.userId, { title: item.title, body: "Consulte ton espace mentorat pour voir la mise à jour.", url: "/dashboard/mentorship" }).catch(() => {})));
      return;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        if (attempt < 2) continue;
        fail("Une autre décision a été prise en même temps. Actualise la page.");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") fail("Cette demande existe déjà. Actualise la page.");
      throw error;
    }
  }
}
