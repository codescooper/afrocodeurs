import "server-only";
import { createHash } from "node:crypto";
import { db } from "./db";
import type { PrismaClient } from "@prisma/client";

export const CREDENTIAL_ATTEMPT_LIMIT = 10;
let nextSweepAt = 0;
// The database clock and atomic upsert enforce one quota across all processes.
export async function consumeCredentialAttempt(email: string, client: Pick<PrismaClient, "$queryRaw" | "$executeRaw"> = db): Promise<boolean> {
  const key = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  try {
    if (Date.now() >= nextSweepAt) {
      nextSweepAt = Date.now() + 60_000;
      // Indexed, bounded cleanup; do not leave a growing table of expired accounts.
      await client.$executeRaw`DELETE FROM "AuthRateLimit" WHERE "key" IN (
        SELECT "key" FROM "AuthRateLimit" WHERE "expiresAt" < statement_timestamp() - interval '1 hour'
        ORDER BY "expiresAt" LIMIT 1000
      )`;
    }
    const rows = await client.$queryRaw<{ count: number }[]>`
      INSERT INTO "AuthRateLimit" ("key", "count", "expiresAt")
      VALUES (${key}, 1, statement_timestamp() + interval '5 minutes')
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "AuthRateLimit"."expiresAt" <= statement_timestamp()
          THEN 1 ELSE "AuthRateLimit"."count" + 1 END,
        "expiresAt" = CASE WHEN "AuthRateLimit"."expiresAt" <= statement_timestamp()
          THEN statement_timestamp() + interval '5 minutes' ELSE "AuthRateLimit"."expiresAt" END
      WHERE "AuthRateLimit"."expiresAt" <= statement_timestamp() OR "AuthRateLimit"."count" < ${CREDENTIAL_ATTEMPT_LIMIT}
      RETURNING "count"
    `;
    return rows.length === 1;
  } catch {
    // Fail closed; never log the supplied email or credentials.
    console.error("[auth] credential limiter unavailable");
    return false;
  }
}
