import { expect, it } from "vitest";
import { NextRequest } from "next/server";
import { shouldShowCommunityEntry } from "../lib/community-entry";
import { POST } from "../app/api/entry/visitor/route";
import { proxy } from "../proxy";

it.each([
  [false, undefined, undefined, true], [true, undefined, undefined, false],
  [false, "1", undefined, false], [false, undefined, "open", false],
  [false, "0", "wrong", true],
])("entry decision signedIn=%s visitor=%s preview=%s", (signedIn, visitor, preview, expected) => {
  expect(shouldShowCommunityEntry(signedIn as boolean, visitor as string | undefined, preview as string | undefined)).toBe(expected);
});
it("remembers only the visitor preference, never puzzle completion or authentication", async () => {
  const response = await POST(new Request("https://afrocodeurs.org/api/entry/visitor", { method: "POST", headers: { origin: "https://afrocodeurs.org" } }));
  const cookie = response.headers.get("set-cookie")!;
  expect(cookie).toContain("afrocodeurs-visitor=1"); expect(cookie).toContain("HttpOnly");
  expect(cookie).not.toContain("afrocodeurs-preview"); expect(response.headers.get("cache-control")).toBe("no-store");
  const result = proxy(new NextRequest("https://afrocodeurs.org/register", { headers: { cookie: "afrocodeurs-visitor=1" } }));
  expect(result.headers.get("location")).toBe("https://afrocodeurs.org/construction");
});
it.each(["https://other.example", "bad-origin"])("refuses foreign or invalid origins: %s", async origin => {
  expect((await POST(new Request("https://afrocodeurs.org/api/entry/visitor", { method: "POST", headers: { origin } }))).status).toBe(403);
});
it("supports the public Host header behind an HTTPS reverse proxy", async () => {
  expect((await POST(new Request("http://internal:3000/api/entry/visitor", { method: "POST", headers: { origin: "https://afrocodeurs.org", host: "afrocodeurs.org" } }))).status).toBe(200);
});
