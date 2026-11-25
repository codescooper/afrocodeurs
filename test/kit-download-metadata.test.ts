import { describe, expect, it } from "vitest";
import { allowedDownloadOrigin, downloadMetadata } from "@/lib/kit-download-metadata";
describe("kit download privacy and provenance", () => {
  it("strips referrer paths and query secrets, normalizes untrusted source and user agent", () => {
    const data = downloadMetadata(new Headers({ referer: "https://example.org/private?email=person@example.org", "user-agent": "Mozilla Chrome/1 Android Mobile", "x-forwarded-for": "192.0.2.1" }), "https://afrocodeurs.org/api/kits/premier-agent-ia?source=person@example.org");
    expect(data).toEqual({ source: "direct", referrer: "https://example.org", browser: "Chrome", os: "Android", device: "Mobile", automated: false });
    expect(JSON.stringify(data)).not.toMatch(/person|192\.0\.2/);
  });
  it("marks likely scanners without claiming to identify every bot", () => {
    expect(downloadMetadata(new Headers({ "user-agent": "curl/8" }), "https://afrocodeurs.org/?source=mail")).toMatchObject({ automated: true, source: "mail" });
  });
  it("rejects cross-site and missing-origin POSTs", () => {
    expect(allowedDownloadOrigin(new Request("https://afrocodeurs.org/api", { headers: { origin: "https://evil.example" } }))).toBe(false);
    expect(allowedDownloadOrigin(new Request("https://afrocodeurs.org/api"))).toBe(false);
    expect(allowedDownloadOrigin(new Request("https://afrocodeurs.org/api", { headers: { origin: "https://afrocodeurs.org" } }))).toBe(true);
  });
});
