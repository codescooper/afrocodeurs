import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("checks the CI PostgreSQL service with its configured role and database", () => {
  const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
  expect(workflow).toContain("POSTGRES_USER: afrocodeurs");
  expect(workflow).toContain("POSTGRES_DB: afrocodeurs");
  expect(workflow).toContain('--health-cmd "pg_isready -U afrocodeurs -d afrocodeurs -h 127.0.0.1"');
  expect(workflow).toContain("npm audit --omit=dev --audit-level=critical");
});
