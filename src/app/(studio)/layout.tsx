import type { ReactNode } from "react";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { Shell } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const me = await requireUser();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [today] = await db
    .select({ sec: sql<number>`coalesce(sum(${activities.durationSec}),0)::int` })
    .from(activities)
    .where(and(eq(activities.userId, me.id), gte(activities.createdAt, start)));

  return (
    <Shell
      user={{ name: me.name, level: me.level, xp: me.xp, streak: me.streak }}
      todayMinutes={Math.round((today?.sec ?? 0) / 60)}
      goalMinutes={me.goalMinutes}
    >
      {children}
    </Shell>
  );
}
