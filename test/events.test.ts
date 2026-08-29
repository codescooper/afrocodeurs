import { describe, expect, it } from "vitest";

import { DISCORD_INVITE_URL } from "@/lib/community-links";
import { discordScheduledEventPayload } from "@/features/events/discord";
import { eventSchema } from "@/features/events/validators";

const baseEvent = {
  title: "Atelier TypeScript AfroCodeurs",
  summary: "Un atelier pratique pour progresser ensemble sur TypeScript.",
  description:
    "Nous construirons une petite application et répondrons aux questions des membres pendant le direct.",
  type: "WORKSHOP",
  format: "ONLINE",
  startsAt: "2026-09-12T18:00:00.000Z",
  endsAt: "2026-09-12T20:00:00.000Z",
  timezone: "Africa/Abidjan",
  platform: "Discord",
  accessUrl: DISCORD_INVITE_URL,
};

describe("événements communautaires", () => {
  it("accepte un live Discord synchronisé", () => {
    const parsed = eventSchema.parse({ ...baseEvent, syncToDiscord: "on" });
    expect(parsed.syncToDiscord).toBe(true);
  });

  it("refuse la synchronisation Discord d’un événement uniquement physique", () => {
    const parsed = eventSchema.safeParse({
      ...baseEvent,
      format: "IN_PERSON",
      venue: "Abidjan",
      syncToDiscord: "on",
    });
    expect(parsed.success).toBe(false);
  });

  it("construit un événement Discord externe avec le lien communautaire", () => {
    const payload = discordScheduledEventPayload({
      ...baseEvent,
      startsAt: new Date(baseEvent.startsAt),
      endsAt: new Date(baseEvent.endsAt),
    });
    expect(payload.entity_type).toBe(3);
    expect(payload.privacy_level).toBe(2);
    expect(payload.entity_metadata.location).toBe(DISCORD_INVITE_URL);
    expect(payload.name).toBe(baseEvent.title);
  });
});
