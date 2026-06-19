import { NextResponse } from "next/server";

import { guard } from "@/lib/guard";
import { captureException } from "@/lib/observability";
import { extForType, saveImage } from "@/lib/storage";

export const runtime = "nodejs"; // fs (repli local) + aws4fetch
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo

/**
 * Upload d'une image. Connexion + email vérifié requis (anti-abus).
 * Multipart `file`. Renvoie `{ url }` (URL publique absolue).
 */
export async function POST(request: Request) {
  const g = await guard({ verified: true });
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: 401 });

  // Anti-CSRF simple : le navigateur envoie `Origin` ; on refuse le cross-origin.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (!extForType(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté (JPEG, PNG, WebP ou GIF)." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image trop lourde (5 Mo maximum)." },
      { status: 413 },
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const url = await saveImage(bytes, file.type);
    return NextResponse.json({ url });
  } catch (error) {
    captureException(error, { route: "/api/upload" });
    return NextResponse.json({ error: "Échec de l'upload." }, { status: 500 });
  }
}
