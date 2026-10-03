"use client";

import { useMemo, useState } from "react";
import { Btn, Meter, Panel, Pill, SectionTitle, Wave } from "@/components/ui";
import { useDictation } from "@/hooks/useDictation";
import { postJson, speak, stopSpeaking } from "@/lib/client";
import { shadowScore } from "@/lib/analyze";
import { SHADOW_LINES } from "@/lib/content";
import { useRouter } from "next/navigation";

export function ShadowTrainer({ level }: { level: string }) {
  const router = useRouter();
  const lines = useMemo(() => {
    const order = { beginner: 0, intermediate: 1, advanced: 2 } as Record<string, number>;
    return [...SHADOW_LINES].sort((a, b) => (order[a.level] ?? 1) - (order[b.level] ?? 1));
  }, []);
  const [idx, setIdx] = useState(() => Math.max(0, lines.findIndex((l) => l.level === level)));
  const [rate, setRate] = useState(0.9);
  const [result, setResult] = useState<{ score: number; missed: string[] } | null>(null);
  const [done, setDone] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  const line = lines[Math.min(idx, lines.length - 1)];

  const d = useDictation({
    onDone: async (text, seconds) => {
      const { score, missedWords } = shadowScore(line.en, text);
      setResult({ score, missed: missedWords });
      setDone((prev) => ({ ...prev, [line.id]: Math.max(prev[line.id] ?? 0, score) }));
      await postJson("/api/practice", {
        kind: "shadow",
        score,
        durationSec: Math.max(12, seconds),
        meta: { lineId: line.id, missed: missedWords.slice(0, 6) },
      }).catch(() => undefined);
      router.refresh();
      setToast(score >= 85 ? "হুবহু মিল! 🎯" : score >= 60 ? "ভালো — বাকি শব্দগুলো লক্ষ্য করুন" : "আরেকবার ধীরে শুনে কপি করুন");
      window.setTimeout(() => setToast(null), 3000);
    },
  });

  const target = line.en.split(" ");
  const avg = Object.values(done).length ? Math.round(Object.values(done).reduce((a, b) => a + b, 0) / Object.values(done).length) : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <SectionTitle
            title="🔁 শ্যাডোয়িং ট্রেনার"
            sub="নেটিভ বাক্য শুনুন → সঙ্গে সঙ্গে হুবহু কপি করে বলুন। উচ্চারণ আর rhythm দুটোই ঠিক হয়।"
            right={<Pill tone="sky">{idx + 1}/{lines.length}</Pill>}
          />

          <div className="rounded-2xl border border-line bg-canvas/50 p-5 text-center">
            <p className="font-display text-[clamp(1.1rem,3vw,1.5rem)] font-semibold leading-snug">{line.en}</p>
            <p className="bangla mt-2 text-sm text-mist">{line.bn}</p>
            <p className="bangla mt-2 text-[11px] uppercase tracking-wider text-jam">focus: {line.focus}</p>

            {result ? (
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {target.map((w, i) => (
                  <span
                    key={w + i}
                    className={`rounded-lg px-2 py-1 text-[13px] font-semibold ${
                      result.missed.includes(w.toLowerCase()) ? "bg-rose/15 text-rose line-through" : "bg-jam/15 text-jam"
                    }`}
                  >
                    {w}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Btn tone="primary" onClick={() => speak(line.en, { rate })}>🔊 শুনুন</Btn>
            <Btn tone="ghost" onClick={() => speak(line.en, { rate: Math.max(0.55, rate - 0.3) })}>🐢 ধীরে</Btn>
            <Btn tone="ghost" onClick={() => { stopSpeaking(); setResult(null); }}>🛑 থামান</Btn>
            <button
              onClick={() => (d.listening ? d.stop() : d.start())}
              className={`relative grid h-12 w-12 place-items-center rounded-full text-lg transition-all ${
                d.listening ? "bg-rose text-[#2a0206]" : "bg-jam text-[#04150f] hover:scale-105"
              }`}
              title="মাইক"
            >
              {d.listening ? <><span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-rose" />⏹</> : "🎤"}
            </button>
            <Wave level={d.level} active={d.listening} bars={16} />
            <div className="ml-auto flex items-center gap-2">
              <span className="bangla text-[11px] text-mist">speed</span>
              <input type="range" min={0.55} max={1.2} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="h-1.5 w-24 accent-jam" />
              <span className="font-display text-xs font-bold text-jam">{rate.toFixed(2)}x</span>
            </div>
          </div>

          {d.error ? <p className="bangla mt-2 text-[12px] text-rose">{d.error}</p> : null}
          {!d.supported ? (
            <p className="bangla mt-2 rounded-xl border border-saffron/40 bg-saffron/10 p-2.5 text-[12px] text-saffron">
              এই ব্রাউজারে recognition নেই — শুনলেনই যথেষ্ট, জোরে জোরে কপি করে বলুন (mirror practice)।
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-between">
            <Btn tone="ghost" onClick={() => { setIdx((i) => Math.max(0, i - 1)); setResult(null); }}>← আগের</Btn>
            <span className="bangla text-[11px] text-mist">{d.listening ? `${d.seconds}s রেকর্ড হচ্ছে` : "রেকর্ড শেষে স্কোর পাবেন"}</span>
            <Btn tone="primary" onClick={() => { setIdx((i) => Math.min(lines.length - 1, i + 1)); setResult(null); }}>পরের →</Btn>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <SectionTitle title="সেশন সারাংশ" sub="এই বসায় কয়টা পরিষ্কার হয়েছে" />
            <div className="space-y-3">
              <Meter label="গড় মিল (match)" value={avg} color="#00c48f" />
              <p className="bangla text-[12px] leading-6 text-mist">
                {done[line.id] !== undefined ? `এই লাইনে সেরা স্কোর: ${done[line.id]}` : "এখনো এই লাইনটা করেননি — ৩ বার টানা কপি করলে mouth muscle memory তৈরি হয়।"}
              </p>
              {result ? (
                <div className={`rounded-xl border p-3 ${result.score >= 85 ? "border-jam/40 bg-jam/10" : "border-saffron/40 bg-saffron/10"}`}>
                  <p className="font-display text-2xl font-bold">{result.score}<span className="text-sm text-mist">/100</span></p>
                  <p className="bangla text-[12px] leading-6 text-mist">
                    {result.missed.length ? `বাদ পড়েছে: ${result.missed.join(", ")}` : "প্রতিটা শব্দ ধরা পড়েছে 👏"}
                  </p>
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="লাইন তালিকা" sub="সবুজ = ৮৫+ মিল" />
            <ul className="max-h-[280px] space-y-1 overflow-y-auto pr-1">
              {lines.map((l, i) => (
                <li key={l.id}>
                  <button
                    onClick={() => { setIdx(i); setResult(null); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                      i === idx ? "bg-jam/12 ring-1 ring-jam/35" : "hover:bg-panel-2"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${done[l.id] >= 85 ? "bg-jam" : done[l.id] ? "bg-saffron" : "bg-line"}`} />
                    <span className="min-w-0 flex-1 truncate text-mist">{l.en}</span>
                    <span className="font-display shrink-0 text-[11px] font-bold text-jam">{done[l.id] ? `${done[l.id]}%` : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {toast ? (
        <p className="bangla fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-jam/50 bg-panel px-4 py-2 text-sm font-semibold text-jam shadow-2xl lg:bottom-8">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
