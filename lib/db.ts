import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Singleton Prisma — évite d'épuiser le pool de connexions en dev (HMR).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 : connexion directe via un driver adapter (le moteur Rust a disparu).
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
