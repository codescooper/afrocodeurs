import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy, config } from "../proxy";
import robots from "../app/robots";
import { communityStructuredData, paginatedPath, publicMetadata, serializeStructuredData, siteUrl } from "../lib/seo";

afterEach(() => vi.unstubAllEnvs());

it("keeps the puzzle only on registration, without a crawler bypass", () => {
  for (const agent of ["Mozilla/5.0", "Googlebot", "OAI-SearchBot"]) {
    for (const path of ["/", "/a-propos", "/communities", "/knowledge", "/projects", "/constellation/service", "/login", "/dashboard", "/messages"]) {
      const response = proxy(new NextRequest(`https://afrocodeurs.org${path}`, { headers: { "user-agent": agent } }));
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
    }
  }
  const blocked = proxy(new NextRequest("https://afrocodeurs.org/register"));
  expect(blocked.headers.get("location")).toBe("https://afrocodeurs.org/construction");
  expect(proxy(new NextRequest("https://afrocodeurs.org/register/", { headers: { cookie: "afrocodeurs-preview=open" } })).headers.get("location")).toBeNull();
  expect(proxy(new NextRequest("https://afrocodeurs.org/construction", { headers: { cookie: "afrocodeurs-preview=open" } })).headers.get("location")).toBe("https://afrocodeurs.org/register");
  expect(config.matcher).toEqual(["/register/:path*", "/construction"]);
});

it("defaults to the real domain and rejects off-site canonical paths", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  expect(siteUrl("/communities")).toBe("https://afrocodeurs.org/communities");
  expect(() => siteUrl("//example.org")).toThrow();
  expect(() => siteUrl("https://example.org")).toThrow();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://afrocodeurs.org/");
  const data = publicMetadata("/projects/service", "Un projet", " Une description\n  de projet ");
  expect(data.alternates?.canonical).toBe("https://afrocodeurs.org/projects/service");
  expect(data.description).toBe("Une description de projet");
  expect(data.openGraph).toMatchObject({ url: "https://afrocodeurs.org/projects/service", images: [{ url: "https://afrocodeurs.org/opengraph-image", width: 1200, height: 630 }] });
});

it("preserves canonical pagination without indexing tracking parameters", () => {
  expect(paginatedPath("/constellation", "2")).toBe("/constellation?page=2");
  expect(paginatedPath("/communities", "2")).toBe("/communities");
  for (const page of ["1", "0", "-1", "1001", "2&token=secret", "abc"]) expect(paginatedPath("/constellation", page)).toBe("/constellation");
});

it("allows search crawlers while excluding private and utility URLs", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://afrocodeurs.org");
  const data = robots();
  expect(data.sitemap).toBe("https://afrocodeurs.org/sitemap.xml");
  const rules = data.rules as { userAgent: string; disallow: string[]; allow: string }[];
  expect(rules.map(rule => rule.userAgent)).toEqual(["*", "OAI-SearchBot"]);
  for (const rule of rules) {
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual(expect.arrayContaining(["/dashboard", "/admin", "/messages", "/register", "/search"]));
    expect(rule.disallow).not.toContain("/communities");
  }
});

it("publishes factual identity data and escapes script injection", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://afrocodeurs.org");
  const data = communityStructuredData();
  expect(data["@graph"].map(item => item["@type"])).toEqual(["Organization", "WebSite"]);
  expect(data["@graph"][0]).toMatchObject({ name: "AfroCodeurs", url: "https://afrocodeurs.org/", email: "info@afrocodeurs.org" });
  expect(JSON.stringify(data)).not.toContain("aggregateRating");
  const unsafe = { text: "</script><script>alert(1)</script>" };
  const serialized = serializeStructuredData(unsafe);
  expect(serialized).not.toContain("<");
  expect(JSON.parse(serialized)).toEqual(unsafe);
});
