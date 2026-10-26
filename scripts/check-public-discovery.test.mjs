import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPublicDiscovery } from "./check-public-discovery.mjs";

function fakeFetch(url, options) {
  assert.equal(options.redirect, "manual");
  assert.equal(options.headers.Cookie, undefined);
  const path = url.pathname;
  if (path === "/register") return new Response(null, { status: 307, headers: { location: "/construction" } });
  if (path === "/opengraph-image") return new Response("image", { headers: { "content-type": "image/png" } });
  return new Response("AfroCodeurs panafricaine contribution communaute constellation Sitemap: <urlset>");
}

test("checks public routes anonymously and preserves the signup puzzle", async () => {
  const results = await checkPublicDiscovery("https://example.org", fakeFetch);
  assert.equal(results.length, 9);
  assert.ok(results.every(result => result.ok));
});

test("fails on redirects, noindex and network errors", async () => {
  for (const fetcher of [
    () => new Response(null, { status: 307, headers: { location: "/construction" } }),
    () => new Response("AfroCodeurs", { headers: { "x-robots-tag": "noindex" } }),
    () => { throw new Error("offline"); },
  ]) {
    const results = await checkPublicDiscovery("https://example.org", fetcher);
    assert.equal(results.find(result => result.path === "/").ok, false);
  }
});

test("rejects offsite signup redirect and non-image sharing response", async () => {
  const results = await checkPublicDiscovery("https://example.org", (url, options) => {
    if (url.pathname === "/register") return new Response(null, { status: 307, headers: { location: "https://other.org/construction" } });
    if (url.pathname === "/opengraph-image") return new Response("error");
    return fakeFetch(url, options);
  });
  assert.equal(results.filter(result => !result.ok).length, 2);
});

test("rejects credentials and non-origin targets", async () => {
  for (const origin of ["file:///tmp/test", "https://user:secret@example.org", "https://example.org/private"]) {
    await assert.rejects(checkPublicDiscovery(origin, fakeFetch));
  }
});
