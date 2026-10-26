import { pathToFileURL } from "node:url";

// Anonymous, read-only smoke checks. Never follows a redirect into a login page.
export async function checkPublicDiscovery(origin, fetcher = fetch) {
  const base = new URL(origin);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
    throw new Error("Provide an HTTP(S) origin without credentials, path or query.");
  }
  const checks = [
    ["/", /AfroCodeurs/i],
    ["/a-propos", /panafricaine/i],
    ["/participer", /contribution/i],
    ["/communities", /communaut/i],
    ["/constellation", /constellation/i],
    ["/robots.txt", /Sitemap:/i],
    ["/sitemap.xml", /<urlset[\s>]/],
    ["/opengraph-image", null],
    ["/register", null],
  ];
  const results = [];
  for (const [path, pattern] of checks) {
    try {
      const response = await fetcher(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "AfroCodeurs-Public-Check/1.0" } });
      const body = await response.text();
      const isSignup = path === "/register";
      const destination = new URL(response.headers.get("location") || "/", base);
      const ok = isSignup
        ? [302, 303, 307, 308].includes(response.status) && destination.origin === base.origin && destination.pathname === "/construction"
        : response.status === 200 && !/noindex/i.test(response.headers.get("x-robots-tag") || "") && (path === "/opengraph-image" ? response.headers.get("content-type")?.startsWith("image/") : pattern.test(body)) && !/<meta\b(?=[^>]*name=["']robots["'])(?=[^>]*content=["'][^"']*noindex)[^>]*>/i.test(body);
      results.push({ path, ok: Boolean(ok), status: response.status });
    } catch (error) {
      results.push({ path, ok: false, error: error instanceof Error ? error.message : "Request failed" });
    }
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await checkPublicDiscovery(process.argv[2] || "https://afrocodeurs.org");
  for (const result of results) console.log(`${result.ok ? "PASS" : "FAIL"} ${result.path} ${result.status ?? result.error}`);
  process.exitCode = results.every(result => result.ok) ? 0 : 1;
}
