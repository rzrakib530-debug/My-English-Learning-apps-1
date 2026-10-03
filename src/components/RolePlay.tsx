"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Meter, Panel, Pill, SectionTitle } from "@/components/ui";
import { postJson, speak, stopSpeaking } from "@/lib/client";
import { SCENARIOS } from "@/lib/content";
import { useDictation } from "@/hooks/useDictation";

export function RolePlay({ starter }: { starter?: string }) {
  const router = useRouter();
  const [sid, setSid] = useState(starter && SCENARIOS.some((s) => s.id === starter) ? starter : SCENARIOS[0].id);
  const [turn, setTurn] = useState(0);
  const [said, setSaid] = useState("");
  const [scores, setScores] = useState<number[]>([]);
  const [phase, setPhase] = useState<"talk" | "judge" | "done">("talk");
  const scenario = SCENARIOS.find((s) => s.id === sid) ?? SCENARIOS[0];
  const t = scenario.turns[Math.min(turn, scenario.turns.length - 1)];

  const dict = useDictation({
    onDone: (text) => {
      if (text.trim()) setSaid(text.trim());
    },
  });

  function judge() {
    const src = said.toLowerCase();
    const hits = t.expect.filter((k) => src.includes(k.toLowerCase()));
    const words = src.split(/\s+/).filter(Boolean).length;
    const coverage = Math.round((100 * hits.length) / Math.max(1, Math.min(3, t.expect.length)));
    const score = Math.max(20, Math.min(100, Math.round(coverage * 0.72 + Math.min(28, words * 1.6))));
    setScores((s) => [...s, score]);
    setPhase("judge");
  }

  async function finish() {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    await postJson("/api/practice", {
      kind: "roleplay",
      score: avg,
      durationSec: Math.max(60, scores.length * 32),
      meta: { scenarioId: scenario.id, turns: scores.length, scores },
    }).catch(() => undefined);
    router.refresh();
    setPhase("done");
  }

  function nextTurn() {
    stopSpeaking();
    if (turn + 1 >= scenario.turns.length) {
      setPhase("judge");
      return;
    }
    setTurn((x) => x + 1);
    setSaid("");
    setPhase("talk");
    const nt = scenario.turns[turn + 1];
    speak(nt.partner, { rate: 0.95 });
  }

  function pick(id: string) {
    setSid(id);
    setTurn(0);
    setSaid("");
    setScores([]);
    setPhase("talk");
    const sc = SCENARIOS.find((s) => s.id === id)!;
    speak(sc.turns[0].partner, { rate: 0.95 });
  }

  const lastScore = scores[scores.length - 1] ?? 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => pick(s.id)}
            className={`panel card-hover p-3 text-left ${s.id === sid ? "ring-1 ring-jam/50" : ""}`}
          >
            <p className="text-2xl">{s.emoji}</p>
            <p className="bangla mt-1 text-[13px] font-bold leading-5">{s.bnTitle}</p>
            <p className="mt-0.5 text-[10px] text-mist">{s.turns.length} turns</p>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <SectionTitle
            title={`🎭 ${scenario.title}`}
            sub={scenario.bnTitle}
            right={<Pill tone="sky">turn {Math.min(turn + 1, scenario.turns.length)}/{scenario.turns.length}</Pill>}
          />

          <div className="rounded-2xl border border-line bg-canvas/60 p-4">
            <p className="bangla text-[11px] font-bold text-mist">পার্টনার বলছে</p>
            <div className="mt-1.5 flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky/15 text-base">🗨️</span>
              <div className="min-w-0">
                <p className="font-display text-[15px] font-semibold leading-relaxed">{t.partner}</p>
                <p className="bangla mt-1 text-[12px] text-mist">{t.partnerBn}</p>
                <button onClick={() => speak(t.partner, { rate: 0.92 })} className="bangla mt-2 rounded-full border border-line px-2.5 py-1 text-[11px] text-jam">
                  🔊 আবার শুনুন
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-line bg-panel-2/40 p-4">
            <div className="flex items-center justify-between">
              <p className="bangla text-[11px] font-bold text-jam">আপনার উত্তর</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => (dict.listening ? dict.stop() : dict.start())}
                  className={`relative grid h-10 w-10 place-items-center rounded-full transition-transform ${dict.listening ? "bg-rose text-[#2a0206]" : "bg-jam text-[#04150f] hover:scale-105"}`}
                >
                  {dict.listening ? <><span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-rose" />⏹</> : "🎤"}
                </button>
                <Btn tone="primary" onClick={judge} disabled={!said.trim() || phase !== "talk"}>
                  মূল্যায়ন
                </Btn>
              </div>
            </div>
            <textarea
              value={said}
              onChange={(e) => setSaid(e.target.value)}
              rows={3}
              placeholder="মাইকে বলুন অথবা এখানে টাইপ করুন…"
              className="mt-2.5 w-full resize-none rounded-xl border border-line bg-canvas/70 p-3 text-sm outline-none focus:border-jam"
            />
            <div className="bangla mt-2 flex flex-wrap gap-1.5 text-[11px] text-mist">
              <span>সংকেত:</span>
              {t.expect.map((k) => (
                <span key={k} className="rounded-full border border-line bg-panel-2/60 px-2 py-0.5">{k}</span>
              ))}
            </div>
            {dict.error ? <p className="bangla mt-2 text-[12px] text-rose">{dict.error}</p> : null}
          </div>

          {phase === "judge" ? (
            <div className="animate-rise mt-3 rounded-2xl border border-jam/35 bg-jam/[0.07] p-4">
              <div className="flex items-center justify-between">
                <p className="bangla text-xs font-bold text-jam">এই টার্নের স্কোর</p>
                <p className="font-display text-xl font-bold">{lastScore}</p>
              </div>
              <div className="mt-2">
                <Meter label="প্রয়োজনীয় আইডিয়া কভার" value={lastScore} color="#00c48f" />
              </div>
              <p className="bangla mt-3 text-[12px] leading-7 text-mist">
                💎 <strong className="text-chalk">এভাবেও বলা যেত:</strong> {t.model}
              </p>
              <button onClick={() => speak(t.model, { rate: 0.95 })} className="bangla mt-2 rounded-full border border-jam/40 px-3 py-1 text-[11px] font-bold text-jam">
                🔊 মডেল উত্তর শুনুন
              </button>
              <div className="mt-3 flex gap-2">
                <Btn tone="primary" onClick={nextTurn}>পরের টার্ন →</Btn>
                <Btn tone="ghost" onClick={() => { setPhase("talk"); setScores((s) => s.slice(0, -1)); }}>↺ আবার বলি</Btn>
                <Btn tone="danger" onClick={finish}>সেশন শেষ</Btn>
              </div>
            </div>
          ) : null}

          {phase === "done" ? (
            <div className="animate-rise mt-3 rounded-2xl border border-lilac/40 bg-lilac/[0.08] p-5 text-center">
              <p className="text-3xl">🎬</p>
              <p className="font-display mt-2 text-lg font-bold">সিনেমা শেষ! {scores.length} টা টার্ন</p>
              <p className="bangla mt-1 text-sm text-mist">
                গড় স্কোর {Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length))} · একই সিনারিও ২ নম্বরবার করলে ভুল প্রায় অর্ধেক হয়ে যায়।
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <Btn tone="ghost" onClick={() => { setTurn(0); setScores([]); setSaid(""); setPhase("talk"); }}>↺ আবার শুরু</Btn>
                <Btn tone="primary" onClick={() => router.push("/call")}>📞 এখন আসল মানুষের সাথে কল</Btn>
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel>
          <SectionTitle title="কীভাবে কাজ করে" sub="রিয়েল লাইফ পরিস্থিতির ট্রেনিং গ্রাউন্ড" />
          <ol className="bangla space-y-2.5 text-[13px] leading-7 text-mist">
            <li className="rounded-xl border border-line bg-panel-2/40 p-3">১️⃣ পার্টনারের লাইন 🔊 শুনুন — বারবার শোনার অনুমতি আছে।</li>
            <li className="rounded-xl border border-line bg-panel-2/40 p-3">২️⃣ মাইকে উত্তর দিন। নিচের সংকেত শব্দগুলো ব্যবহার করার চেষ্টা করুন।</li>
            <li className="rounded-xl border border-line bg-panel-2/40 p-3">৩️⃣ মূল্যায়ন চাপলে coverage + length দেখে স্কোর পাবেন, সাথে model answer।</li>
            <li className="rounded-xl border border-line bg-panel-2/40 p-3">৪️⃣ শেষে পুরো সিনারিওর গড় স্কোর প্রোফাইলে জমা হবে।</li>
          </ol>
          <div className="mt-4 rounded-xl border border-saffron/30 bg-saffron/[0.07] p-3">
            <p className="bangla text-[12px] leading-6 text-chalk">
              🎯 <strong>টিপস:</strong> উত্তর দেওয়ার আগে ১ সেকেন্ড থামুন। তাড়াহুড়োয় grammar পড়ে যায়, থামলে mind sentence সাজাতে পারে।
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
