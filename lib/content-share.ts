/** Share only the public content URL, never query parameters or fragments. */
export function publicShareUrl(path: string, origin: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || /[\\?#]/.test(path)) {
    throw new Error("Invalid public content path");
  }
  const base = new URL(origin);
  if (!['https:', 'http:'].includes(base.protocol)) {
    throw new Error("Invalid public origin");
  }
  const url = new URL(path, base.origin);
  if (url.origin !== base.origin) throw new Error("Invalid public content origin");
  return url.href;
}

export function whatsappShareUrl(title: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${title.trim()}\n${url}`)}`;
}

export function isShareCancellation(error: unknown): boolean {
  return typeof error === "object" && error !== null &&
    "name" in error && error.name === "AbortError";
}
