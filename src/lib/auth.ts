import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const COOKIE = "bol_token";

export type SessionUser = typeof users.$inferSelect;

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const user = await db.query.users.findFirst({ where: eq(users.token, token) });
  return user ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/");
  return user;
}

export async function setSessionToken(token: string) {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
}

export async function clearSessionToken() {
  const store = await cookies();
  store.delete(COOKIE);
}

export function newToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function yesterdayKey() {
  return todayKey(new Date(Date.now() - 86400000));
}

/** Recompute the streak and add XP. Call after any completed practice. */
export async function awardPractice(
  userId: string,
  opts: { xp: number; touchStreak?: boolean },
) {
  const me = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!me) return;
  let streak = me.streak ?? 0;
  if (opts.touchStreak !== false) {
    if (me.lastPracticeDay === todayKey()) streak = Math.max(streak, 1);
    else if (me.lastPracticeDay === yesterdayKey()) streak += 1;
    else streak = 1;
  }
  await db
    .update(users)
    .set({ xp: me.xp + opts.xp, streak, lastPracticeDay: todayKey(), lastSeenAt: new Date() })
    .where(eq(users.id, userId));
}
