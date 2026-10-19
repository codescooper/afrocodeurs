import { randomBytes } from "node:crypto";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Prisma, type PrismaClient } from "@prisma/client";
import type { Adapter } from "next-auth/adapters";

export function AfroCodeursAdapter(prisma: PrismaClient): Adapter {
  return {
    ...PrismaAdapter(prisma),
    // Existing email registrations may have preserved uppercase characters.
    getUserByEmail: (email) => prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
    }),
    async createUser(data) {
      const email = data.email?.trim().toLowerCase();
      if (!email) throw new Error("OAuth email required");
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await prisma.user.create({
            data: {
              email,
              name: data.name,
              image: data.image,
              // OAuth identity is not our email-verification flow.
              emailVerified: null,
              username: `maker_${randomBytes(8).toString("hex")}`,
            },
          });
        } catch (error) {
          const target = error instanceof Prisma.PrismaClientKnownRequestError
            ? error.meta?.target : null;
          const usernameCollision = error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002" && Array.isArray(target) && target.includes("username");
          if (!usernameCollision || attempt === 2) throw error;
        }
      }
      throw new Error("OAuth username allocation failed");
    },
  };
}
