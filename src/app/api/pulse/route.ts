import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { rooms, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim().length >= 2) patch.name = body.name.trim().slice(0, 30);
  if (["beginner", "intermediate", "advanced"].includes(String(body.level))) patch.level = body.level;
  if (body.goalMinutes !== undefined) patch.goalMinutes = Math.min(180, Math.max(5, Number(body.goalMinutes) || 20));
  if (!Object.keys(patch).length) return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  const [updated] = await db.update(users).set(patch).where(eq(users.id, me.id)).returning();
  return NextResponse.json({ ok: true, user: { name: updated.name, level: updated.level, goalMinutes: updated.goalMinutes } });
}

export async function POST() {
  // heartbeat: presence + online count
  const me = await getSessionUser();
  if (me) await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, me.id));
  const [{ online }] = await db
    .select({ online: sql<number>`count(*) filter (where ${users.lastSeenAt} > now() - interval '2 minutes')::int` })
    .from(users);
  const [{ waiting }] = await db
    .select({ waiting: sql<number>`count(*)::int` })
    .from(rooms)
    .where(eq(rooms.status, "waiting"));
  return NextResponse.json({ online: online ?? 0, waiting: waiting ?? 0 });
}
