import { NextResponse } from "next/server";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { rooms, signals } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const KINDS = ["offer", "answer", "ice", "chat", "end", "react"];

/** long-ish polling: give me everything after my cursor that wasn't sent by me */
export async function GET(req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  const code = id.toUpperCase();
  const url = new URL(req.url);
  const after = Number(url.searchParams.get("after") ?? 0);

  const [room] = await db.select().from(rooms).where(eq(rooms.id, code));
  if (!room) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (room.hostId !== me.id && room.guestId !== me.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (room.status === "ended") return NextResponse.json({ signals: [], ended: true, cursor: after });

  const rows = await db
    .select()
    .from(signals)
    .where(and(eq(signals.roomId, code), gt(signals.id, after), sql`${signals.fromId} <> ${me.id}`))
    .orderBy(asc(signals.id))
    .limit(60);

  return NextResponse.json({
    signals: rows.map((r) => ({ id: r.id, kind: r.kind, from: r.fromId, payload: r.payload, at: r.createdAt })),
    cursor: rows.length ? rows[rows.length - 1].id : after,
    ended: false,
  });
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
  const kind = String(body.kind ?? "");
  if (!KINDS.includes(kind)) return NextResponse.json({ error: "bad kind" }, { status: 400 });
  const payload = (body.payload ?? {}) as Record<string, unknown>;
  if (kind === "chat") payload.text = String(payload.text ?? "").slice(0, 300);

  const [row] = await db.insert(signals).values({ roomId: code, fromId: me.id, kind, payload }).returning();
  return NextResponse.json({ ok: true, id: row.id });
}

/** cleanup endpoint (used when a browser tab closes the call) */
export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await ctx.params;
  const code = id.toUpperCase();
  await db.delete(signals).where(and(eq(signals.roomId, code), sql`${signals.createdAt} < now() - interval '5 minutes'`));
  return NextResponse.json({ ok: true });
}
