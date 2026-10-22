import { promises as fs } from "node:fs";
import path from "node:path";

const types: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
const missing = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

/** Runtime uploads are not part of Next's build-time public-file manifest. */
export async function uploadResponse(parts: string[], head = false, root = path.join(process.cwd(), "public", "uploads")) {
  if (!parts.length || parts.some((part) => !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(part))) return missing();
  const type = types[path.extname(parts.at(-1)!).toLowerCase()];
  if (!type) return missing();
  try {
    // Files come from the runtime upload volume, not the build output.
    const base = await fs.realpath(/* turbopackIgnore: true */ root);
    const file = await fs.realpath(/* turbopackIgnore: true */ path.join(base, ...parts));
    const relative = path.relative(base, file);
    if (!relative || relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) return missing();
    const stat = await fs.stat(/* turbopackIgnore: true */ file);
    if (!stat.isFile()) return missing();
    return new Response(head ? null : new Uint8Array(await fs.readFile(/* turbopackIgnore: true */ file)), { headers: {
      "Content-Type": type, "Content-Length": String(stat.size),
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    } });
  } catch (error) {
    if (["ENOENT", "ENOTDIR", "ELOOP"].includes((error as NodeJS.ErrnoException).code ?? "")) return missing();
    throw error;
  }
}
