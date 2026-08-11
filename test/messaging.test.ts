import { describe, expect, it } from "vitest";
import { createConversationSchema, messageSchema } from "@/features/messaging/validators";

describe("messaging validators", () => {
  it("accepte un message normal", () => {
    expect(messageSchema.safeParse({ body: "Bonjour la communauté !" }).success).toBe(true);
  });

  it("rejette les messages vides et trop longs", () => {
    expect(messageSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(messageSchema.safeParse({ body: "x".repeat(2001) }).success).toBe(false);
  });

  it("accepte une liste de membres et limite le titre", () => {
    expect(createConversationSchema.safeParse({ usernames: "codeurnwar, afromaker", title: "Équipe Abidjan" }).success).toBe(true);
    expect(createConversationSchema.safeParse({ usernames: "abc", title: "x".repeat(81) }).success).toBe(false);
  });
});
