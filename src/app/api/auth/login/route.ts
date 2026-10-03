import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { newToken, setSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 30);
  const level = ["beginner", "intermediate", "advanced"].includes(String(body.level))
    ? String(body.level)
    : "beginner";
  const goalMinutes = Math.min(180, Math.max(5, Number(body.goalMinutes) || 20));
  if (name.length < 2) {
    return NextResponse.json({ error: "নাম লিখুন (কমপক্ষে ২ অক্ষর)" }, { status: 400 });
  }
  const token = newToken();
  const [me] = await db.insert(users).values({ name, level, goalMinutes, token }).returning();
  await setSessionToken(token);
  return NextResponse.json({ ok: true, user: { id: me.id, name: me.name, level: me.level } });
}
