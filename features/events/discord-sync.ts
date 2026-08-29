import "server-only";

import { db } from "@/lib/db";
import { DISCORD_GUILD_ID } from "@/lib/community-links";
import { discordScheduledEventPayload } from "./discord";

type DiscordApiEvent = { id?: string; message?: string };

export function discordEventSyncConfigured(): boolean {
  return Boolean(process.env.DISCORD_BOT_TOKEN);
}

export async function syncEventToDiscord(eventId: string): Promise<void> {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) return;

  await db.event.update({
    where: { id: event.id },
    data: { discordSyncStatus: "PENDING", discordSyncError: null },
  });

  try {
    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID || DISCORD_GUILD_ID;
    if (!token) {
      throw new Error(
        "Le bot Discord n’est pas encore configuré sur le serveur AfroCodeurs.",
      );
    }

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/scheduled-events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(discordScheduledEventPayload(event)),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    const body = (await response.json().catch(() => ({}))) as DiscordApiEvent;
    if (!response.ok || !body.id) {
      throw new Error(
        body.message
          ? `Discord a refusé la synchronisation : ${body.message}`
          : `Discord a répondu avec le statut ${response.status}.`,
      );
    }

    await db.event.update({
      where: { id: event.id },
      data: {
        discordEventId: body.id,
        discordEventUrl: `https://discord.com/events/${guildId}/${body.id}`,
        discordSyncStatus: "SYNCED",
        discordSyncError: null,
        discordSyncedAt: new Date(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 500)
        : "La synchronisation Discord a échoué.";
    await db.event.update({
      where: { id: event.id },
      data: { discordSyncStatus: "FAILED", discordSyncError: message },
    });
  }
}
