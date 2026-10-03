import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { awardPractice, getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const KINDS = ["speak", "shadow", "vocab", "grammar", "roleplay", "call"];

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const kind = KINDS.includes(String(body.kind)) ? String(body.kind) : "speak";
  const score = Math.min(100, Math.max(0, Number(body.score) || 0));
  const durationSec = Math.min(3600, Math.max(0, Math.round(Number(body.durationSec) || 0)));
  const xpBase = { speak: 12, shadow: 7, vocab: 3, grammar: 4, roleplay: 9, call: 14 }[kind as (typeof KINDS)[number]];
  const xp = Math.max(2, Math.round((xpBase ?? 5) + score / 12 + durationSec / 90));

  const [row] = await db
    .insert(activities)
    .values({ userId: me.id, kind, score, durationSec, xp, meta: body.meta ?? {} })
    .returning();
  await awardPractice(me.id, { xp });

  return NextResponse.json({ ok: true, id: row.id, xp });
}

export async function DELETE(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(activities).where(eq(activities.id, id));
  return NextResponse.json({ ok: true });
}
