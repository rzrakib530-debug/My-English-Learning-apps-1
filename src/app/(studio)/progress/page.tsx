import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { Dial, Meter, Panel, Pill, SectionTitle } from "@/components/ui";
import { SettingsForm } from "@/components/SettingsForm";
import { KIND_LABEL } from "@/lib/client";

export const dynamic = "force-dynamic";

const DAY = 86400000;

type Fix = { wrong: string; right: string; whyBn?: string; type?: string };

export default async function ProgressPage() {
  const me = await requireUser();
  const from = new Date(Date.now() - 14 * DAY);
  const rows = await db
    .select({
      id: activities.id,
      kind: activities.kind,
      score: activities.score,
      durationSec: activities.durationSec,
      xp: activities.xp,
      meta: activities.meta,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .where(and(eq(activities.userId, me.id), gte(activities.createdAt, from)))
    .orderBy(desc(activities.createdAt));

  const all = rows;
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(Date.now() - (13 - i) * DAY);
    const key = d.toISOString().slice(0, 10);
    const dayRows = all.filter((r) => new Date(r.createdAt).toISOString().slice(0, 10) === key);
    return {
      key,
      label: d.toLocaleDateString("bn-BD", { weekday: "short" }).slice(0, 3),
      minutes: Math.round(dayRows.reduce((a, b) => a + b.durationSec, 0) / 60),
      count: dayRows.length,
    };
  });
  const maxMin = Math.max(20, ...days.map((d) => d.minutes));

  const speak = all.filter((r) => r.kind === "speak");
  const avgSkill = { accuracy: 0, fluency: 0, vocabulary: 0, confidence: 0 };
  speak.forEach((r) => {
    const s = (r.meta as { scores?: typeof avgSkill }).scores;
    if (!s) return;
    (Object.keys(avgSkill) as (keyof typeof avgSkill)[]).forEach((k) => (avgSkill[k] += (s[k] ?? 0) / speak.length));
  });
  const hasSkill = speak.length > 0;
  const band = speak.length
    ? Math.round((speak.reduce((a, r) => a + Number((r.meta as { band?: number }).band ?? 5), 0) / speak.length) * 2) / 2
    : 0;

  const kinds = ["speak", "call", "shadow", "roleplay", "grammar", "vocab"].map((k) => {
    const r = all.filter((x) => x.kind === k);
    return {
      kind: k,
      count: r.length,
      minutes: Math.round(r.reduce((a, b) => a + b.durationSec, 0) / 60),
      avg: r.length ? Math.round(r.reduce((a, b) => a + b.score, 0) / r.length) : 0,
      xp: r.reduce((a, b) => a + b.xp, 0),
    };
  });

  const fixMap = new Map<string, Fix & { n: number }>();
  speak.forEach((r) => {
    ((r.meta as { fixes?: Fix[] }).fixes ?? []).forEach((f) => {
      const cur = fixMap.get(f.wrong);
      if (cur) cur.n += 1;
      else fixMap.set(f.wrong, { ...f, n: 1 });
    });
  });
  const mistakes = [...fixMap.values()].sort((a, b) => b.n - a.n).slice(0, 8);

  const totalMinutes = Math.round(all.reduce((a, b) => a + b.durationSec, 0) / 60);
  const calls = all.filter((r) => r.kind === "call");
  const level = me.xp >= 1200 ? "প্রো লেভেল" : me.xp >= 600 ? "কনফিডেন্ট স্পিকার" : me.xp >= 200 ? "ওয়ার্ম-আপ শেষ" : "নব্য প্র্যাকটিস";
  const nextLevelXp = me.xp >= 1200 ? 2400 : me.xp >= 600 ? 1200 : me.xp >= 200 ? 600 : 200;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { t: "মোট প্র্যাকটিস", v: `${totalMinutes}m`, s: "১৪ দিনে", c: "text-jam" },
          { t: "সেশন", v: String(all.length), s: `${calls.length} টা লাইভ কল`, c: "text-sky" },
          { t: "আনুমানিক band", v: band ? `≈ ${band}` : "—", s: "IELTS speaking estimate", c: "text-saffron" },
          { t: "স্ট্রিক", v: `🔥 ${me.streak}`, s: `${me.xp} XP · ${level}`, c: "text-lilac" },
        ].map((x) => (
          <Panel key={x.t}>
            <p className="bangla text-[11px] font-semibold text-mist">{x.t}</p>
            <p className={`font-display mt-1 text-2xl font-bold ${x.c}`}>{x.v}</p>
            <p className="bangla text-[11px] text-mist">{x.s}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <Panel>
          <SectionTitle title="১৪ দিনের প্র্যাকটিস" sub="প্রতিদিন কত মিনিট কথা বললেন — বার যত লম্বা, অভ্যাস তত শক্ত" right={<Pill tone="jam">daily minutes</Pill>} />
          <div className="flex h-52 items-end gap-1.5">
            {days.map((d) => (
              <div key={d.key} className="group flex flex-1 flex-col items-center gap-1.5">
                <span className="font-display text-[10px] text-mist opacity-0 transition-opacity group-hover:opacity-100">{d.minutes}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-jam-deep via-jam to-saffron transition-all duration-500"
                  style={{ height: `${Math.max(3, (d.minutes / maxMin) * 100)}%`, opacity: d.minutes ? 1 : 0.18 }}
                  title={`${d.minutes} মিনিট · ${d.count} সেশন`}
                />
                <span className="bangla text-[10px] text-mist">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 h-px bg-line" />
          <div className="mt-4 space-y-2.5">
            {kinds.map((k) => (
              <div key={k.kind} className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                <Meter label={`${KIND_LABEL[k.kind]} · ${k.count} সেশন · ${k.minutes}m · +${k.xp} XP`} value={k.avg} />
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <SectionTitle title="স্কিল রাডার" sub={hasSkill ? `${speak.length} টা speaking সেশন থেকে` : "একটা speaking টাস্ক শেষ করলে এটা ভরে যাবে"} />
            <Radar values={avgSkill} active={hasSkill} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              {Object.entries(avgSkill).map(([k, v]) => (
                <div key={k} className="rounded-xl border border-line bg-panel-2/50 p-2">
                  <p className="font-display text-base font-bold text-chalk">{Math.round(v)}</p>
                  <p className="bangla text-[10px] capitalize text-mist">{k}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="পরবর্তী লক্ষ্য" sub="XP দিয়ে লেভেল বাড়ে" />
            <div className="flex items-center gap-4">
              <Dial value={Math.min(100, (me.xp / nextLevelXp) * 100)} size={104} label={`${me.xp}/${nextLevelXp}`} />
              <div className="bangla flex-1 space-y-2 text-[12px] leading-6 text-mist">
                <p>🎯 প্রতিদিন অন্তত একটা speaking + একটা shadowing সেশন = ধ্রুবক অগ্রগতি।</p>
                <p>📞 সপ্তাহে ৩টা লাইভ কল করলে confidence সবচেয়ে দ্রুত বাড়ে।</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel>
        <SectionTitle title="আপনার ভুলের ব্যাংক" sub="সবচেয়ে বেশি যে প্যাটার্নগুলো ঠিক করাগিয়েছেন — এগুলোই আজ ফোকাস" right={<Pill tone="rose">personalised</Pill>} />
        {mistakes.length === 0 ? (
          <p className="bangla rounded-xl border border-dashed border-line p-4 text-sm leading-7 text-mist">
            এখনো কোনো প্যাটার্ন জমা হয়নি। কয়েকটা speaking টাস্ক শেষ করুন — অ্যাপ নিজে থেকেই দেখাবে কোন ভুলগুলো বারবার করছেন।
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {mistakes.map((m) => (
              <div key={m.wrong} className="rounded-xl border border-line bg-panel-2/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-rose line-through decoration-rose/40">{m.wrong}</p>
                  <Pill tone="rose">×{m.n}</Pill>
                </div>
                <p className="font-display mt-1 text-[13px] font-bold text-jam">→ {m.right}</p>
                {m.whyBn ? <p className="bangla mt-1.5 text-[11px] leading-6 text-mist">{m.whyBn}</p> : null}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <SettingsForm user={{ name: me.name, level: me.level, goalMinutes: me.goalMinutes }} />
    </div>
  );
}

function Radar({ values, active }: { values: Record<string, number>; active: boolean }) {
  const keys = ["accuracy", "fluency", "vocabulary", "confidence"];
  const cx = 110;
  const cy = 92;
  const r = 70;
  const pts = keys.map((k, i) => {
    const ang = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
    const v = Math.max(0.12, Math.min(1, (values[k] ?? 0) / 100)) * (active ? 1 : 0.12);
    return [cx + Math.cos(ang) * r * v, cy + Math.sin(ang) * r * v];
  });
  const rings = [0.33, 0.66, 1];
  return (
    <svg viewBox="0 0 220 184" className="mx-auto w-full max-w-[260px]">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={keys
            .map((_, i) => {
              const ang = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
              return `${cx + Math.cos(ang) * r * ring},${cy + Math.sin(ang) * r * ring}`;
            })
            .join(" ")}
          fill="none"
          stroke="#1d3b34"
          strokeWidth={1}
        />
      ))}
      {keys.map((_, i) => {
        const ang = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(ang) * r} y2={cy + Math.sin(ang) * r} stroke="#1d3b34" strokeWidth={1} />;
      })}
      <polygon points={pts.map((p) => p.join(",")).join(" ")} fill="rgba(0,196,143,0.28)" stroke="#00c48f" strokeWidth={2} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3.4} fill="#7ef0c9" />
      ))}
      {keys.map((k, i) => {
        const ang = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
        return (
          <text key={k} x={cx + Math.cos(ang) * (r + 20)} y={cy + Math.sin(ang) * (r + 16)} textAnchor="middle" fontSize="10" fill="#9cb8ae" style={{ textTransform: "capitalize" }}>
            {k}
          </text>
        );
      })}
    </svg>
  );
}
