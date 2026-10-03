import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { activities, callRatings, rooms, signals, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  const [room] = await db.select().from(rooms).where(eq(rooms.id, id.toUpperCase()));
  if (!room) return NextResponse.json({ error: "not found" }, { status: 404 });

  const partnerId = room.hostId === me.id ? room.guestId : room.hostId;
  let partner: { name: string; level: string; xp: number; streak: number } | null = null;
  if (partnerId) {
    const [p] = await db
      .select({ name: users.name, level: users.level, xp: users.xp, streak: users.streak })
      .from(users)
      .where(eq(users.id, partnerId));
    partner = p ?? null;
  }
  const [{ online }] = await db
    .select({ online: sql<number>`count(*) filter (where ${users.lastSeenAt} > now() - interval '2 minutes')::int` })
    .from(users);

  return NextResponse.json({ room, partner, isHost: room.hostId === me.id, online: online ?? 0 });
}

export async function POST(req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  const code = id.toUpperCase();
  const [room] = await db.select().from(rooms).where(eq(rooms.id, code));
  if (!room) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (room.hostId !== me.id && room.guestId !== me.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "topic") {
    const topic = String(body.topic ?? "").slice(0, 200);
    await db.update(rooms).set({ topic }).where(eq(rooms.id, code));
    return NextResponse.json({ ok: true, topic });
  }

  if (action === "leave") {
    const startedAt = room.startedAt ? new Date(room.startedAt).getTime() : Date.now();
    const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    const partnerId = room.hostId === me.id ? room.guestId : room.hostId;
    await db.update(rooms).set({ status: "ended", endedAt: new Date() }).where(eq(rooms.id, code));
    await db.delete(signals).where(eq(signals.roomId, code));
    const xp = Math.max(6, Math.round(12 + (seconds / 60) * 3));
    await creditCall(me.id, xp, seconds);
    if (partnerId) await creditCall(partnerId, xp, seconds);
    return NextResponse.json({ ok: true, seconds, xp });
  }

  if (action === "rate") {
    const stars = Math.min(5, Math.max(1, Number(body.stars) || 5));
    const partnerId = room.hostId === me.id ? room.guestId : room.hostId;
    if (!partnerId) return NextResponse.json({ error: "no partner" }, { status: 400 });
    await db
      .insert(callRatings)
      .values({ roomId: code, userId: me.id, partnerId, stars, note: String(body.note ?? "").slice(0, 300) || null });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

async function creditCall(userId: string, xp: number, seconds: number) {
  await db.insert(activities).values({ userId, kind: "call", score: 80, durationSec: seconds, xp, meta: { source: "voice-call" } });
  await db
    .update(users)
    .set({
      xp: sql`${users.xp} + ${xp}`,
      streak: sql`case
        when ${users.lastPracticeDay} = to_char(now(), 'YYYY-MM-DD') then greatest(${users.streak}, 1)
        when ${users.lastPracticeDay} = to_char(now() - interval '1 day', 'YYYY-MM-DD') then ${users.streak} + 1
        else 1 end`,
      lastPracticeDay: sql`to_char(now(), 'YYYY-MM-DD')`,
      lastSeenAt: new Date(),
    })
    .where(eq(users.id, userId));
}
