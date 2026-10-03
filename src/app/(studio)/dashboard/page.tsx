import Link from "next/link";
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { activities, cardProgress, rooms, users } from "@/db/schema";
import { requireUser, todayKey, yesterdayKey } from "@/lib/auth";
import { TOPICS } from "@/lib/content";
import { Dial, Panel, Pill, SectionTitle } from "@/components/ui";
import { KIND_LABEL } from "@/lib/client";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const me = await requireUser();
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startWeek = new Date(Date.now() - 7 * 86400000);

  const [todays, week, myCards, others, recent, leaderboard] = await Promise.all([
    db.select().from(activities).where(and(eq(activities.userId, me.id), gte(activities.createdAt, startToday))),
    db
      .select({ kinds: sql<string>`array_agg(${activities.kind})`, xp: sql<number>`sum(${activities.xp})::int` })
      .from(activities)
      .where(and(eq(activities.userId, me.id), gte(activities.createdAt, startWeek))),
    db
      .select({ key: cardProgress.cardKey })
      .from(cardProgress)
      .where(and(eq(cardProgress.userId, me.id), lt(cardProgress.dueAt, new Date()))),
    db
      .select({
        due: sql<number>`count(*) filter (where ${cardProgress.dueAt} < now())::int`,
        learned: sql<number>`count(*) filter (where ${cardProgress.intervalDays} >= 4)::int`,
      })
      .from(cardProgress)
      .where(eq(cardProgress.userId, me.id)),
    db
      .select({ id: activities.id, kind: activities.kind, score: activities.score, xp: activities.xp, meta: activities.meta, at: activities.createdAt })
      .from(activities)
      .where(eq(activities.userId, me.id))
      .orderBy(desc(activities.createdAt))
      .limit(6),
    db.select({ id: users.id, name: users.name, xp: users.xp, streak: users.streak })
      .from(users).orderBy(desc(users.xp)).limit(10),
  ]);

  const [rankRow] = await db
    .select({ rank: sql<number>`count(*) + 1::int` })
    .from(users)
    .where(gt(me.xp));
  const [{ online }] = await db
    .select({ online: sql<number>`count(*) filter (where ${users.lastSeenAt} > now() - interval '2 minutes')::int` })
    .from(users);
  const waitingRooms = await db
    .select({ id: rooms.id, level: rooms.level, createdAt: rooms.createdAt, hostName: users.name })
    .from(rooms)
    .innerJoin(users, eq(rooms.hostId, users.id))
    .where(and(eq(rooms.status, "waiting"), gte(rooms.createdAt, new Date(Date.now() - 25 * 60000))))
    .orderBy(asc(rooms.createdAt))
    .limit(4);

  const todayMinutes = Math.round(todays.reduce((a, b) => a + b.durationSec, 0) / 60);
  const todayXp = todays.reduce((a, b) => a + b.xp, 0);
  const goalPct = Math.min(100, Math.round((todayMinutes / Math.max(1, me.goalMinutes)) * 100));

  // weakest skill from recent speaking sessions
  const speakish = recent.filter((r) => r.kind === "speak" && (r.meta as { scores?: unknown })?.scores).slice(0, 5);
  const avg = { accuracy: 0, fluency: 0, vocabulary: 0, confidence: 0 };
  speakish.forEach((r) => {
    const s = (r.meta as { scores?: typeof avg }).scores ?? avg;
    (Object.keys(avg) as (keyof typeof avg)[]).forEach((k) => (avg[k] += (s[k] ?? 0) / speakish.length));
  });
  const weakest = speakish.length
    ? (Object.entries(avg).sort((a, b) => a[1] - b[1])[0][0] as keyof typeof avg)
    : null;
  const weakLabel: Record<string, { bn: string; href: string; cta: string }> = {
    accuracy: { bn: "grammar এর ভুল তুলনামূলকভাবে বেশি", href: "/grammar", cta: "গ্রামার ক্যাম্পে যান" },
    fluency: { bn: "মাঝে মাঝে আটকে যাচ্ছেন", href: "/shadow", cta: "শ্যাডোয়িং করুন" },
    vocabulary: { bn: "শব্দ ঘুরপাক খাচ্ছে", href: "/vocab", cta: "ফ্ল্যাশকার্ড দেখুন" },
    confidence: { bn: "কথার দৈর্ঘ্য বাড়ানো দরকার", href: "/call", cta: "লাইভ কল করে দেখুন" },
  };

  const dayNum = new Date().getDate();
  const topic = TOPICS[(dayNum - 1) % TOPICS.length];
  const weekXp = week[0]?.xp ?? 0;
  const myCardsDue = (others[0]?.due ?? 0) + myCards.length;

  return (
    <div className="space-y-5">
      <div className="panel relative overflow-hidden p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 animate-floaty rounded-full bg-jam/15 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="relative">
            <p className="bangla text-sm text-mist">
              {new Date().toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="font-display mt-1 text-[clamp(1.5rem,4vw,2.2rem)] font-bold leading-tight">
              আসসালামু আলাইকুম, {me.name} 👋
            </h1>
            <p className="bangla mt-2 max-w-[58ch] text-sm leading-7 text-mist">
              {todayMinutes === 0
                ? "আজো প্র্যাকটিস হয়নি — ২ মিনিটের একটা speaking task দিয়ে শুরু করুন, স্ট্রিক বাঁচান।"
                : `আজ ${todayMinutes} মিনিট কথা বলে ফেলেছেন। ${goalPct >= 100 ? "লক্ষ্য পূর্ণ — দারুণ! 🔥" : "আরেকটাকে round করে লক্ষ্য পূর্ণ করুন।"}`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/speak" className="rounded-full bg-jam px-4 py-2 text-sm font-bold text-[#04150f] transition-transform hover:scale-[1.03]">
                🎙️ এখনই কথা বলুন
              </Link>
              <Link href="/call" className="bangla soft-btn rounded-full px-4 py-2 text-sm font-bold text-chalk">
                📞 partner খুঁজুন ({online ?? 0} জন অনলাইন)
              </Link>
            </div>
          </div>
          <div className="relative flex items-center gap-4">
            <Dial value={goalPct} size={124} label="আজকের লক্ষ্য" sub={`${todayMinutes}/${me.goalMinutes} মিনিট`} />
            <div className="space-y-2">
              <div className="rounded-xl border border-saffron/35 bg-saffron/10 px-3 py-2 text-center">
                <p className="font-display text-lg font-bold text-saffron">🔥 {me.streak}</p>
                <p className="bangla text-[10px] text-mist">দিনের স্ট্রিক</p>
              </div>
              <div className="rounded-xl border border-jam/35 bg-jam/10 px-3 py-2 text-center">
                <p className="font-display text-lg font-bold text-jam">+{todayXp}</p>
                <p className="bangla text-[10px] text-mist">আজকের XP</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionTitle
            title="আজকের speaking mission"
            sub={`লেভেল: ${me.level} · ${topic.minutes} মিনিট · রেকর্ড করে ফিডব্যাক পান`}
            right={<Pill tone="jam">daily</Pill>}
          />
          <p className="font-display text-lg font-semibold leading-snug">{topic.en}</p>
          <p className="bangla mt-1.5 text-sm leading-7 text-mist">{topic.bn}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {topic.hints.map((h) => (
              <p key={h} className="rounded-xl border border-line bg-panel-2/60 px-3 py-2 text-[12px] text-mist">
                💬 {h}
              </p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/speak?topic=${topic.id}`} className="rounded-full bg-jam px-4 py-2 text-sm font-bold text-[#04150f]">
              মিশন শুরু করুন
            </Link>
            <Link href={`/speak`} className="bangla soft-btn rounded-full px-4 py-2 text-sm font-semibold text-chalk">
              অন্য টপিক দেখুন
            </Link>
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="পার্সোনালাইজড পরামর্শ" sub="আপনার সাম্প্রতিক স্কোর বিশ্লেষণ করে" />
          {weakest ? (
            <div className="rounded-2xl border border-line bg-panel-2/60 p-4">
              <p className="bangla text-xs text-mist">সবচেয়ে দুর্বল দিক</p>
              <p className="font-display mt-1 text-lg font-bold text-saffron capitalize">{weakest}</p>
              <p className="bangla mt-1 text-[13px] leading-7 text-mist">{weakLabel[weakest].bn}</p>
              <Link href={weakLabel[weakest].href} className="bangla mt-3 inline-block rounded-full bg-jam px-4 py-2 text-xs font-bold text-[#04150f]">
                {weakLabel[weakest].cta} →
              </Link>
            </div>
          ) : (
            <p className="bangla text-sm leading-7 text-mist">
              এখনো যথেষ্ট speaking data নেই। প্রথমে একটা speaking task শেষ করুন — পরে আমরা বলবো কোন দিকে কাজ বসাতে হবে।
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <Link href="/vocab" className="rounded-xl border border-line bg-panel-2/50 p-3 hover:border-jam/40">
              <p className="font-display text-xl font-bold text-sky">{myCardsDue}</p>
              <p className="bangla text-[11px] text-mist">কার্ড ডু-টুডে</p>
            </Link>
            <Link href="/progress" className="rounded-xl border border-line bg-panel-2/50 p-3 hover:border-jam/40">
              <p className="font-display text-xl font-bold text-jam">{weekXp}</p>
              <p className="bangla text-[11px] text-mist">এই সপ্তাহের XP</p>
            </Link>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel>
          <SectionTitle title="সাম্প্রতিক সেশন" sub="গত কয়েকটা প্র্যাকটিস" />
          <ul className="space-y-2">
            {recent.length === 0 && <li className="bangla text-sm text-mist">এখনো কোনো সেশন নেই — প্রথমটা আজই করুন।</li>}
            {recent.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel-2/50 px-3 py-2">
                <span className="text-lg">{kindIcon(r.kind)}</span>
                <span className="min-w-0 flex-1">
                  <span className="bangla block truncate text-sm font-semibold">{KIND_LABEL[r.kind] ?? r.kind}</span>
                  <span className="bangla block text-[11px] text-mist">
                    {new Date(r.at).toLocaleString("bn-BD", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                  </span>
                </span>
                <span className="text-right">
                  <span className="font-display block text-sm font-bold text-jam">{r.score}</span>
                  <span className="block text-[10px] text-mist">+{r.xp} XP</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <SectionTitle title="কল লবি" sub="যারা এখন কথা বলার জন্য অপেক্ষা করছে" right={<Pill tone="sky">live</Pill>} />
          {waitingRooms.length === 0 ? (
            <p className="bangla text-sm leading-7 text-mist">
              এখন কারো জন্য অপেক্ষা হচ্ছে না। নিজে রুম খুলে কোড শেয়ার করুন — বন্ধুর সাথেও then প্র্যাকটিস করতে পারবেন।
            </p>
          ) : (
            <ul className="space-y-2">
              {waitingRooms.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel-2/50 px-3 py-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-sky/12 text-sm">🧑</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.hostName}</span>
                    <span className="bangla block text-[11px] text-mist">
                      {r.level} · {Math.max(0, Math.round((Date.now() - new Date(r.createdAt).getTime()) / 60000))} মিনিট আগে
                    </span>
                  </span>
                  <Link href={`/call?join=${r.id}`} className="bangla rounded-full bg-jam px-3 py-1.5 text-[11px] font-bold text-[#04150f]">
                    কল করুন
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/call" className="bangla mt-4 block rounded-xl border border-jam/40 bg-jam/10 px-3 py-2.5 text-center text-sm font-bold text-jam">
            📞 ভয়েস রুমে ঢুকুন
          </Link>
        </Panel>

        <Panel>
          <SectionTitle title="লিডারবোর্ড" sub={`আপনার র‍্যাঙ্ক #${rankRow?.rank ?? 1}`} />
          <ol className="space-y-1.5">
            {leaderboard.map((u, i) => (
              <li
                key={u.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${u.id === me.id ? "bg-jam/12 ring-1 ring-jam/40" : "bg-panel-2/40"}`}
              >
                <span className="font-display w-5 text-sm font-bold text-mist">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {u.name} {u.id === me.id ? <span className="bangla text-[10px] text-jam">(আপনি)</span> : null}
                </span>
                <span className="bangla text-[11px] text-saffron">🔥{u.streak}</span>
                <span className="font-display text-sm font-bold text-jam">{u.xp}</span>
              </li>
            ))}
            {leaderboard.length === 0 ? <li className="bangla text-sm text-mist">এখনো কেউ নেই — আপনি প্রথম!</li> : null}
          </ol>
        </Panel>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/shadow", icon: "🔁", t: "শ্যাডোয়িং", b: "২০টা বাক্য, উচ্চারণ match" },
          { href: "/roleplay", icon: "🎭", t: "রোল-প্লে", b: "৫টা বাস্তব পরিস্থিতি" },
          { href: "/grammar", icon: "📐", t: "গ্রামার ক্যাম্প", b: "৫ লেসন + কুইজ" },
          { href: "/progress", icon: "📊", t: "প্রগ্রেস", b: "১৪ দিনের চার্ট, radar" },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="panel card-hover p-4">
            <p className="text-2xl">{c.icon}</p>
            <p className="bangla mt-2 text-sm font-bold">{c.t}</p>
            <p className="bangla mt-0.5 text-[11px] text-mist">{c.b}</p>
          </Link>
        ))}
      </div>

      <p className="bangla pb-2 text-center text-[11px] text-mist">
        সর্বশেষ প্র্যাকটিস: {me.lastPracticeDay === todayKey() ? "আজ" : me.lastPracticeDay === yesterdayKey() ? "গতকাল" : "একটু আগে"} · streak ভাঙাতে দিনে অন্তত একটা সেশন শেষ করুন
      </p>
    </div>
  );
}

function kindIcon(kind: string) {
  return { speak: "🎙️", shadow: "🔁", vocab: "🃏", grammar: "📐", roleplay: "🎭", call: "📞" }[kind] ?? "✅";
}

function gt(x: number) {
  return sql`${users.xp} > ${x}`;
}
