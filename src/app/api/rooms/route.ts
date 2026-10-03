import { NextResponse } from "next/server";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { rooms, users } from "@/db/schema";
import { CALL_TOPICS } from "@/lib/content";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function roomCode() {
  let s = "";
  for (let i = 0; i < 5; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "auth" }, { status: 401 });
  const mine = await db
    .select()
    .from(rooms)
    .where(
      and(
        or(eq(rooms.hostId, me.id), eq(rooms.guestId, me.id)),
        sql`${rooms.status} <> 'ended'`,
        sql`${rooms.createdAt} > now() - interval '2 hours'`,
      ),
    )
    .orderBy(desc(rooms.createdAt))
    .limit(1);

  const open = await db
    .select({ id: rooms.id, level: rooms.level, topic: rooms.topic, hostName: users.name, createdAt: rooms.createdAt })
    .from(rooms)
    .innerJoin(users, eq(rooms.hostId, users.id))
    .where(and(eq(rooms.status, "waiting"), sql`${rooms.hostId} <> ${me.id}`, sql`${rooms.createdAt} > now() - interval '25 minutes'`))
    .orderBy(sql`${rooms.createdAt} ASC`)
    .limit(6);

  return NextResponse.json({
    room: mine[0] ?? null,
    openRooms: open.map((o) => ({
      ...o,
      minutesAgo: Math.max(0, Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000)),
    })),
  });
}

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const mode = String(body.mode ?? "find");
  const level = String(body.level ?? me.level);

  // Already inside a live room? Reuse it.
  const existing = await db
    .select()
    .from(rooms)
    .where(
      and(
        or(eq(rooms.hostId, me.id), eq(rooms.guestId, me.id)),
        sql`${rooms.status} <> 'ended'`,
        sql`${rooms.createdAt} > now() - interval '2 hours'`,
      ),
    )
    .limit(1);
  if (existing[0] && mode !== "join") {
    return NextResponse.json({ room: existing[0], role: existing[0].hostId === me.id ? "host" : "guest" });
  }

  if (mode === "join") {
    const code = String(body.code ?? "").toUpperCase().trim();
    if (code.length < 4) return NextResponse.json({ error: "কোডটা ঠিক করে লিখুন" }, { status: 400 });
    const target = await db.select().from(rooms).where(eq(rooms.id, code)).limit(1);
    const room = target[0];
    if (!room) return NextResponse.json({ error: "এই কোডের কোনো রুম নেই" }, { status: 404 });
    if (room.hostId === me.id) return NextResponse.json({ error: "নিজের রুমে যোগ দেওয়া যায় না" }, { status: 400 });
    if (room.guestId && room.guestId !== me.id && room.status === "active")
      return NextResponse.json({ error: "রুমটি ইতিমধ্যেই দুই জন ব্যবহার করছে" }, { status: 409 });
    const [updated] = await db
      .update(rooms)
      .set({ guestId: me.id, status: "active", startedAt: new Date(), topic: room.topic ?? randomTopic() })
      .where(eq(rooms.id, room.id))
      .returning();
    return NextResponse.json({ room: updated, role: "guest" });
  }

  if (mode === "create") {
    const [room] = await db
      .insert(rooms)
      .values({ id: await uniqueCode(), hostId: me.id, status: "waiting", level, topic: randomTopic() })
      .returning();
    return NextResponse.json({ room, role: "host", waiting: true });
  }

  // find: grab the oldest waiting room that isn't mine, atomically
  const picked = await db.execute(sql`
    WITH chosen AS (
      SELECT id FROM rooms
      WHERE status = 'waiting'
        AND host_id <> ${me.id}
        AND created_at > now() - interval '25 minutes'
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE rooms r
       SET status = 'active', guest_id = ${me.id}, started_at = now(),
           topic = coalesce(r.topic, ${randomTopic()})
      FROM chosen
     WHERE r.id = chosen.id
     RETURNING r.*
  `);
  const raw = (picked as unknown as { rows?: Record<string, unknown>[] }).rows ?? [];
  if (raw[0]) {
    const r = raw[0];
    const room = {
      id: String(r.id),
      hostId: String(r.host_id ?? r.hostId),
      guestId: (r.guest_id ?? r.guestId) as string | null,
      status: String(r.status),
      topic: (r.topic ?? null) as string | null,
      level: (r.level ?? null) as string | null,
      createdAt: r.created_at ?? r.createdAt,
      startedAt: r.started_at ?? r.startedAt,
      endedAt: null,
    };
    return NextResponse.json({ room, role: "guest" });
  }

  const [room] = await db
    .insert(rooms)
    .values({ id: await uniqueCode(), hostId: me.id, status: "waiting", level, topic: randomTopic() })
    .returning();
  return NextResponse.json({ room, role: "host", waiting: true });
}

/** housekeeping: close stale rooms + drop signalling data after an ended call */
export async function DELETE() {
  await db.execute(sql`
    DELETE FROM signals WHERE room_id IN (
      SELECT id FROM rooms WHERE status = 'ended' OR created_at < now() - interval '2 hours'
    );
    UPDATE rooms SET status = 'ended', ended_at = now()
     WHERE status <> 'ended' AND created_at < now() - interval '2 hours';
  `);
  const [{ left }] = await db.select({ left: sql<number>`count(*)::int` }).from(rooms).where(eq(rooms.status, "waiting"));
  return NextResponse.json({ ok: true, waiting: left ?? 0 });
}

async function uniqueCode() {
  for (let i = 0; i < 8; i++) {
    const code = roomCode();
    const clash = await db.select({ id: rooms.id }).from(rooms).where(and(eq(rooms.id, code), sql`${rooms.status} <> 'ended'`));
    if (!clash.length) return code;
  }
  return roomCode() + Math.floor(Math.random() * 9);
}

function randomTopic() {
  const t = CALL_TOPICS[Math.floor(Math.random() * CALL_TOPICS.length)];
  return `${t.en} ||| ${t.bn}`;
}
