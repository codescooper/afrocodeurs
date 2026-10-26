import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("checks the CI PostgreSQL service with its configured role and database", () => {
  const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
  expect(workflow).toContain("POSTGRES_USER: afrocodeurs");
  expect(workflow).toContain("POSTGRES_DB: afrocodeurs");
  expect(workflow).toContain('--health-cmd "pg_isready -U afrocodeurs -d afrocodeurs -h 127.0.0.1"');
  expect(workflow).toContain("npm audit --omit=dev --audit-level=high");
});

it("enables database integration suites instead of silently skipping them", () => {
  const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
  for (const name of ["constellation", "mentorship"]) {
    expect(workflow).toContain(`createdb --host=127.0.0.1 --port=5432 --username=afrocodeurs ${name}_test`);
    expect(workflow).toContain(`DATABASE_URL=postgresql://afrocodeurs:afrocodeurs@127.0.0.1:5432/${name}_test npx prisma migrate deploy`);
    expect(workflow).toContain(`${name.toUpperCase()}_TEST_DATABASE_URL: postgresql://afrocodeurs:afrocodeurs@127.0.0.1:5432/${name}_test`);
  }
});
