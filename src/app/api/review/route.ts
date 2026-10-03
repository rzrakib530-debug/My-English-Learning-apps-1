import { NextResponse } from "next/server";
import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardProgress } from "@/db/schema";
import { VOCAB } from "@/lib/content";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ease = (n: number) => Math.max(130, Math.min(320, n));

export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "auth" }, { status: 401 });
  const rows = await db.select().from(cardProgress).where(eq(cardProgress.userId, me.id));
  const now = Date.now();
  const map = new Map(rows.map((r) => [r.cardKey, r]));
  const due = VOCAB.filter((c) => {
    const p = map.get(c.key);
    if (!p) return true; // brand new card
    return new Date(p.dueAt).getTime() <= now;
  }).slice(0, 20);
  return NextResponse.json({
    queue: due,
    stats: {
      total: VOCAB.length,
      learned: rows.filter((r) => r.intervalDays >= 4).length,
      due: due.length,
      reps: rows.reduce((a, b) => a + b.reps, 0),
    },
  });
}

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const cardKey = String(body.cardKey ?? "");
  const rating = Math.min(3, Math.max(0, Number(body.rating) || 0)); // 0 again · 1 hard · 2 good · 3 easy
  if (!VOCAB.some((c) => c.key === cardKey)) return NextResponse.json({ error: "unknown card" }, { status: 400 });

  const [existing] = await db
    .select()
    .from(cardProgress)
    .where(and(eq(cardProgress.userId, me.id), eq(cardProgress.cardKey, cardKey)))
    .execute();

  const cur = existing ?? { ease: 250, intervalDays: 0, reps: 0, lapses: 0, id: "" };
  let { ease: e, intervalDays, reps, lapses } = {
    ease: cur.ease,
    intervalDays: cur.intervalDays,
    reps: cur.reps,
    lapses: cur.lapses,
  };
  if (rating === 0) {
    lapses += 1;
    intervalDays = 0;
    e = ease(e - 20);
  } else if (rating === 1) {
    intervalDays = Math.max(1, Math.round((intervalDays || 1) * 1.2));
    e = ease(e - 12);
  } else if (rating === 2) {
    intervalDays = intervalDays ? Math.round((intervalDays * e) / 100) : 1;
    reps += 1;
  } else {
    intervalDays = (intervalDays || 1) * 2.5 + 1;
    e = ease(e + 15);
    reps += 1;
  }
  const dueAt = new Date(Date.now() + intervalDays * 86400000 + (rating === 0 ? 10 * 60000 : 0));
  const values = { ease: e, intervalDays: Math.round(intervalDays), reps, lapses, dueAt, updatedAt: sql`now()` };

  if (existing) {
    await db.update(cardProgress).set(values).where(eq(cardProgress.id, existing.id));
  } else {
    await db.insert(cardProgress).values({ userId: me.id, cardKey, ...values });
  }
  return NextResponse.json({ ok: true, dueInDays: Math.round(intervalDays) });
}

/** Peek at a card that is due today without grading it */
export async function PUT(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const key = String(body.cardKey ?? "");
  const [row] = await db
    .select()
    .from(cardProgress)
    .where(and(eq(cardProgress.userId, me.id), eq(cardProgress.cardKey, key), lte(cardProgress.dueAt, new Date())))
    .execute();
  return NextResponse.json({ found: Boolean(row) });
}
