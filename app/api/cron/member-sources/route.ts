import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { refreshSource } from "@/features/member-sources/service";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") || "";
  const wanted = `Bearer ${expected}`;
  if (!expected || Buffer.byteLength(supplied) !== Buffer.byteLength(wanted) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(wanted))) return Response.json({error:"Non autorisé"},{status:401});
  const sources = await db.memberSource.findMany({where:{OR:[{lastCheckedAt:null},{lastCheckedAt:{lt:new Date(Date.now()-3600000)}}]},orderBy:{lastCheckedAt:{sort:"asc",nulls:"first"}},take:8});
  let imported=0, failed=0;
  // Sequential and bounded: no publication and no outbound mail.
  for (const s of sources) { try { await refreshSource(s.id,s.userId); imported++; } catch { failed++; } }
  return Response.json({checked:sources.length,imported,failed});
}
