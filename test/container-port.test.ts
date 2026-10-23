import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("container HTTP port", () => {
  it("uses the same Fetch-compatible port for Next, exposure and health checks", async () => {
    const docker = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
    const compose = readFileSync(new URL("../compose.yaml", import.meta.url), "utf8");
    expect(docker).toContain("ENV PORT=3000");
    expect(docker).toContain("EXPOSE 3000");
    expect(compose).toContain('      - "3000"');
    expect(compose).toContain("http://127.0.0.1:3000/api/health");
    expect(docker + compose).not.toContain("4190");
    // Native Fetch rejects unsafe ports before attempting any connection.
    await expect(fetch("http://127.0.0.1:4190/")).rejects.toMatchObject({ cause: { message: "bad port" } });
  });
});
