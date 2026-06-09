import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Configuration Prisma 7. En v7, l'URL de connexion ne vit plus dans
 * schema.prisma (datasource.url supprimé) mais ici, pour Migrate/CLI.
 * Le client applicatif se connecte via un driver adapter (cf. lib/db.ts).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
