import { uploadResponse } from "@/lib/upload-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: Context) {
  return uploadResponse((await context.params).path);
}

export async function HEAD(_request: Request, context: Context) {
  return uploadResponse((await context.params).path, true);
}
