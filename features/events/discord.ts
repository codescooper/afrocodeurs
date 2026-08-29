import { DISCORD_INVITE_URL } from "@/lib/community-links";

export type DiscordEventInput = {
  title: string;
  summary: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  accessUrl?: string | null;
};

export type DiscordScheduledEventPayload = {
  name: string;
  description: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  privacy_level: 2;
  entity_type: 3;
  channel_id: null;
  entity_metadata: { location: string };
};

export function discordScheduledEventPayload(
  event: DiscordEventInput,
): DiscordScheduledEventPayload {
  return {
    name: event.title.trim().slice(0, 100),
    description: `${event.summary.trim()}\n\n${event.description.trim()}`.slice(
      0,
      1000,
    ),
    scheduled_start_time: event.startsAt.toISOString(),
    scheduled_end_time: event.endsAt.toISOString(),
    privacy_level: 2,
    entity_type: 3,
    channel_id: null,
    entity_metadata: {
      location: event.accessUrl?.trim() || DISCORD_INVITE_URL,
    },
  };
}
