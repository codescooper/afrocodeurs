import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ users: [] }, { status: 401 });
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 40) ?? "";
  if (q.length < 2) return NextResponse.json({ users: [] });
  const users = await db.user.findMany({
    where: {
      id: { not: session.user.id },
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { username: "asc" },
    take: 8,
    select: { id: true, username: true, name: true, image: true },
  });
  return NextResponse.json({ users });
}
