import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { AwsClient } from "aws4fetch";

const s3 = {
  endpoint: process.env.S3_ENDPOINT?.replace(/\/$/, ""),
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY,
  bucket: process.env.S3_BUCKET,
  region: process.env.S3_REGION || "auto",
  publicUrl: process.env.S3_PUBLIC_URL?.replace(/\/$/, ""),
};

/** Vrai si un stockage objet S3-compatible est entièrement configuré. */
export const isS3Configured = Boolean(
  s3.endpoint && s3.accessKey && s3.secretKey && s3.bucket,
);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Extension de fichier pour un type MIME image supporté, sinon `null`. */
export function extForType(contentType: string): string | null {
  return EXT_BY_TYPE[contentType] ?? null;
}

function objectKey(ext: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `uploads/${yyyy}/${mm}/${randomUUID()}.${ext}`;
}

/**
 * Stocke une image et renvoie son URL publique **absolue**.
 *
 * - Stockage objet **S3-compatible** si configuré (prod : Railway, R2, MinIO, AWS…).
 * - Sinon, repli sur le **disque local** `public/` (dev) — servi par Next à `/uploads/…`.
 *   Le disque d'un conteneur est éphémère : à n'utiliser qu'en développement.
 */
export async function saveImage(
  bytes: Uint8Array<ArrayBuffer>,
  contentType: string,
): Promise<string> {
  const ext = extForType(contentType);
  if (!ext) throw new Error("Type d'image non supporté.");
  const key = objectKey(ext);

  if (isS3Configured) {
    const client = new AwsClient({
      accessKeyId: s3.accessKey!,
      secretAccessKey: s3.secretKey!,
      region: s3.region,
      service: "s3",
    });
    const res = await client.fetch(`${s3.endpoint}/${s3.bucket}/${key}`, {
      method: "PUT",
      body: bytes,
      headers: { "content-type": contentType },
    });
    if (!res.ok) {
      throw new Error(`Le stockage objet a refusé l'upload (${res.status}).`);
    }
    const base = s3.publicUrl ?? `${s3.endpoint}/${s3.bucket}`;
    return `${base}/${key}`;
  }

  const filePath = path.join(process.cwd(), "public", key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, bytes);
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${siteUrl}/${key}`;
}
