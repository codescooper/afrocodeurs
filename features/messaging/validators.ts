import { z } from "zod";

export const createConversationSchema = z.object({
  usernames: z.string().min(3).max(620),
  title: z.string().trim().max(80).optional(),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Écrivez un message").max(2000, "2 000 caractères maximum"),
});
