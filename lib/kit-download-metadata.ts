/** No cookies, IP, raw user agent or recipient identifiers are stored. */
export function downloadRetentionCutoff() { return new Date(Date.now() - 90 * 86400000); }

export function downloadMetadata(headers: Headers, url: string) {
  const ua = headers.get("user-agent") ?? "";
  const source = new URL(url).searchParams.get("source");
  let referrer = "direct";
  try { referrer = new URL(headers.get("referer") ?? "").origin; } catch { /* absent */ }
  return {
    source: ["article", "mail", "test"].includes(source ?? "") ? source! : "direct",
    referrer: referrer.slice(0, 200),
    browser: /Edg\//i.test(ua) ? "Edge" : /Firefox\//i.test(ua) ? "Firefox" : /Chrome\//i.test(ua) ? "Chrome" : /Safari\//i.test(ua) ? "Safari" : "Autre",
    os: /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows" : /Macintosh/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "Autre",
    device: /Mobile|Android|iPhone/i.test(ua) ? "Mobile" : /iPad|Tablet/i.test(ua) ? "Tablette" : "Ordinateur/autre",
    automated: /bot|crawler|spider|preview|scanner|curl|wget/i.test(ua),
  };
}

export function allowedDownloadOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin && request.headers.get("sec-fetch-site") !== "cross-site";
}
