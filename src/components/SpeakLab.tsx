"use client";

import { useMemo, useState } from "react";
import { Btn, Dial, Meter, Panel, Pill, SectionTitle, Wave } from "@/components/ui";
import { useDictation } from "@/hooks/useDictation";
import { postJson, scoreTone, speak } from "@/lib/client";
import type { Analysis } from "@/lib/analyze";
import { TOPICS, type Topic } from "@/lib/content";
import { useRouter } from "next/navigation";

export function SpeakLab({ level, initialTopicId }: { level: string; initialTopicId?: string }) {
  const router = useRouter();
  const topics = useMemo(
    () => [...TOPICS].sort((a, b) => (a.level === level ? -1 : b.level === level ? 1 : 0)),
    [level],
  );
  const [topicId, setTopicId] = useState(initialTopicId ?? topics[0]?.id ?? TOPICS[0].id);
  const [custom, setCustom] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [best, setBest] = useState(0);
  const [attempts, setAttempts] = useState<{ words: number; score: number }[]>([]);
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const topic = TOPICS.find((t) => t.id === topicId) ?? TOPICS[0];
  const prompt = custom.trim() || topicPrompt(topic);

  const d = useDictation({
    maxSeconds: 240,
    onDone: async (text, seconds) => {
      if (text.split(/\s+/).filter(Boolean).length < 3) {
        setToast("অন্তত ৩টা শব্দ বলুন — তারপর ফিডব্যাক আসবে।");
        return;
      }
      setBusy(true);
      try {
        const { analysis } = await postJson<{ analysis: Analysis }>("/api/coach", { transcript: text, seconds });
        setAnalysis(analysis);
        setAttempts((a) => [...a, { words: analysis.words, score: analysis.overall }].slice(-5));
        if (analysis.overall > best) setBest(analysis.overall);
        const res = await postJson<{ xp: number }>("/api/practice", {
          kind: "speak",
          score: analysis.overall,
          durationSec: seconds,
          meta: {
            topicId: topic.id,
            scores: analysis.scores,
            words: analysis.words,
            band: analysis.band,
            fixes: analysis.corrections.map((c) => ({ wrong: c.wrong, right: c.right, whyBn: c.whyBn, type: c.type })),
          },
        });
        setToast(`সেশন সেভ হয়েছে · +${res.xp} XP`);
        if (voiceFeedback) speak(`Your score is ${analysis.overall} out of 100. ${analysis.corrections.length} things to fix. Try saying: ${analysis.rewritten}`);
        router.refresh();
        window.setTimeout(() => setToast(null), 4200);
      } catch (e) {
        setToast(e instanceof Error ? e.message : "ফিডব্যাক আনা যায়নি");
      } finally {
        setBusy(false);
      }
    },
  });

  const tone = analysis ? scoreTone(analysis.overall) : null;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <SectionTitle
            title="🎙️ স্পিকিং ল্যাব"
            sub="১–৩ মিনিট কথা বলুন। ট্রান্সক্রিপ্ট থেকে কোচ ভুল ধরিয়ে দেবে, বাংলায় বুঝিয়ে।"
            right={<Pill tone="jam">speech recognition</Pill>}
          />
          <div className="flex flex-wrap gap-1.5">
            {topics.slice(0, 10).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTopicId(t.id);
                  setCustom("");
                  setAnalysis(null);
                  d.reset();
                }}
                className={`bangla rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  t.id === topicId && !custom ? "border-jam bg-jam/15 text-chalk" : "border-line bg-panel-2/50 text-mist hover:border-jam/40"
                }`}
              >
                {t.en.length > 40 ? t.en.slice(0, 38) + "…" : t.en}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-panel-2/50 p-4">
            <p className="bangla text-[11px] font-bold uppercase tracking-wider text-mist">আপনার টাস্ক</p>
            <p className="font-display mt-1.5 text-[17px] font-semibold leading-snug">{prompt}</p>
            <div className="bangla mt-2 flex flex-wrap gap-1.5 text-[11px] text-mist">
              {!custom &&
                topic.hints.map((h) => (
                  <span key={h} className="rounded-full border border-line px-2 py-0.5">
                    {h}
                  </span>
                ))}
              {!custom && <Pill tone="saffron">{topic.level}</Pill>}
            </div>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="…অথবা নিজের বিষয় লিখে ফেলুন (English)"
              className="mt-3 w-full rounded-xl border border-line bg-canvas/70 px-3 py-2 text-sm outline-none focus:border-jam"
            />
          </div>

          <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-line bg-canvas/50 p-5">
            <button
              onClick={() => (d.listening ? d.stop() : d.start())}
              disabled={busy}
              className={`relative grid h-20 w-20 place-items-center rounded-full text-2xl font-bold transition-all ${
                d.listening ? "bg-rose text-[#2a0206]" : "bg-jam text-[#04150f] hover:scale-105"
              }`}
            >
              {d.listening ? <><span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-rose" />⏹</> : "🎤"}
            </button>
            <p className="bangla text-xs text-mist">
              {busy ? "কোচ বিশ্লেষণ করছে…" : d.listening ? `রেকর্ডিং… ${Math.floor(d.seconds / 60)}:${String(d.seconds % 60).padStart(2, "0")} (থামাতে আবার চাপুন)` : "শুরু করতে মাইক চাপুন"}
            </p>
            <Wave level={d.level} active={d.listening} />
            {!d.supported ? (
              <p className="bangla rounded-xl border border-saffron/40 bg-saffron/10 p-3 text-center text-[12px] leading-6 text-saffron">
                এই ব্রাউজারে voice recognition নেই (Chrome/Edge সেরা)। নিচে টাইপ করেও পুরো ফিডব্যাক পাওয়া যায়।
              </p>
            ) : null}
            {d.error ? <p className="bangla text-[12px] text-rose">{d.error}</p> : null}

            <textarea
              value={d.transcript + (d.interim ? " " + d.interim : "")}
              onChange={(e) => d.setTranscriptManual(e.target.value)}
              rows={5}
              placeholder="আপনার কথা এখানে লেখা হবে — চাইলে এডিট বা টাইপও করতে পারেন।"
              className="min-h-[120px] w-full resize-y rounded-xl border border-line bg-panel/70 p-3 text-sm outline-none focus:border-jam"
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Btn tone="ghost" onClick={() => speak(prompt, { rate: 0.9 })}>▶️ টাস্ক শুনুন</Btn>
              <Btn
                tone="ghost"
                onClick={() => {
                  setBusy(true);
                  postJson<{ analysis: Analysis }>("/api/coach", { transcript: d.transcript, seconds: Math.max(10, d.seconds) })
                    .then((r) => setAnalysis(r.analysis))
                    .catch((e) => setToast(e instanceof Error ? e.message : "বিশ্লেষণ করা যায়নি"))
                    .finally(() => setBusy(false));
                }}
                disabled={!d.transcript.trim() || busy}
              >
                🔍 এখনই বিশ্লেষণ
              </Btn>
              <Btn tone="ghost" onClick={() => { d.reset(); setAnalysis(null); }}>↺ রিসেট</Btn>
            </div>
          </div>

          {attempts.length > 1 ? (
            <p className="bangla mt-3 text-center text-[11px] text-mist">
              আজকের attempt: {attempts.map((a) => a.score).join(" → ")} · সেরা {best}
            </p>
          ) : null}
        </Panel>

        <Panel>
          <SectionTitle title="কোচ রিপোর্ট" sub="স্কোর, ভুল, সংশোধন — সব" right={tone ? <Pill tone="jam">{tone.label}</Pill> : undefined} />
          {!analysis && !busy ? (
            <div className="rounded-2xl border border-dashed border-line bg-panel/40 p-6 text-center">
              <p className="text-3xl">🎧</p>
              <p className="bangla mt-2 text-sm leading-7 text-mist">
                একটা উত্তর বলে ফেলুন — ১৫ সেকেন্ডের মধ্যে এখানে ৪টা স্কোর, ভুলের তালিকা আর rewrite চলে আসবে।
              </p>
            </div>
          ) : null}
          {busy && !analysis ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-panel-2/70" />
              ))}
            </div>
          ) : null}
          {analysis ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Dial value={analysis.overall} color={tone?.color} label="overall" sub={`band ≈ ${analysis.band}`} />
                <div className="flex-1 space-y-2.5">
                  <Meter label="accuracy (ঠিক)" value={analysis.scores.accuracy} color="#00c48f" />
                  <Meter label="fluency (গতি)" value={analysis.scores.fluency} color="#56b8ff" />
                  <Meter label="vocabulary (শব্দ)" value={analysis.scores.vocabulary} color="#b39cff" />
                  <Meter label="confidence (আত্মবিশ্বাস)" value={analysis.scores.confidence} color="#ffb020" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat k="words" v={analysis.words} />
                <Stat k="words/min" v={analysis.wpm} />
                <Stat k="sentences" v={analysis.sentences} />
                <Stat k="unique" v={analysis.uniqueWords} />
              </div>

              {analysis.corrections.length > 0 ? (
                <div className="space-y-2">
                  <p className="bangla text-xs font-bold text-mist">ঠিক করুন ({analysis.corrections.length})</p>
                  {analysis.corrections.map((c) => (
                    <div key={c.id} className="rounded-xl border border-line bg-panel-2/60 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-[13px] text-rose line-through">{c.wrong}</p>
                        <span className="text-mist">→</span>
                        <p className="font-display text-[13px] font-bold text-jam">{c.right}</p>
                        <Pill tone={c.type === "grammar" ? "rose" : c.type === "vocabulary" ? "sky" : "saffron"}>{c.type}</Pill>
                      </div>
                      <p className="bangla mt-1.5 text-[12px] leading-6 text-mist">🇧🇩 {c.whyBn}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="bangla rounded-xl border border-jam/35 bg-jam/10 p-3 text-[13px] leading-6 text-jam">
                  এই বাক্যে উল্লেখযোগ্য grammar ভুল পাইনি — পরেরবার আরও লম্বা উত্তর দিন।
                </p>
              )}

              <div className="rounded-xl border border-jam/30 bg-jam/[0.07] p-3.5">
                <div className="flex items-center justify-between">
                  <p className="bangla text-xs font-bold text-jam">কোচ সংস্করণ</p>
                  <button onClick={() => speak(analysis.rewritten, { rate: 0.95 })} className="bangla rounded-full border border-jam/40 px-2.5 py-1 text-[11px] text-jam">
                    🔊 শুনুন
                  </button>
                </div>
                <p className="font-display mt-1.5 text-[14px] leading-relaxed">{analysis.rewritten}</p>
              </div>

              <div className="rounded-xl border border-line bg-panel-2/50 p-3.5">
                <p className="bangla text-xs font-bold text-saffron">👏 ভালো লেগেছে</p>
                <ul className="bangla mt-1.5 space-y-1 text-[12px] leading-6 text-mist">
                  {analysis.praise.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
                <p className="bangla mt-3 text-xs font-bold text-sky">🎯 পরের ধাপ</p>
                <ul className="bangla mt-1.5 space-y-1.5 text-[12px] leading-6 text-mist">
                  {analysis.nextSteps.map((s, i) => (
                    <li key={s}>
                      • {s}
                      {analysis.nextStepsBn[i] ? <span className="block text-[11px] text-mist/80">{analysis.nextStepsBn[i]}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="bangla flex items-center gap-2 text-[11px] text-mist">
                  <input type="checkbox" checked={voiceFeedback} onChange={(e) => setVoiceFeedback(e.target.checked)} className="accent-jam" />
                  ইংরেজিতে শুনে শিখুন (TTS)
                </label>
                <Btn
                  tone="primary"
                  onClick={() => {
                    d.reset();
                    setAnalysis(null);
                    d.start();
                  }}
                >
                  🔁 আবার বলুন
                </Btn>
                <Btn
                  tone="ghost"
                  onClick={() => {
                    const next = TOPICS[Math.floor(Math.random() * TOPICS.length)];
                    setTopicId(next.id);
                    setCustom("");
                    setAnalysis(null);
                    d.reset();
                  }}
                >
                  ⏭️ পরের টপিক
                </Btn>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      {toast ? (
        <p className="bangla fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-jam/50 bg-panel px-4 py-2 text-sm font-semibold text-jam shadow-2xl lg:bottom-8">
          {toast}
        </p>
      ) : null}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: number }) {
  return (
    <div className="rounded-xl border border-line bg-panel-2/50 px-2 py-2 text-center">
      <p className="font-display text-lg font-bold text-chalk">{v}</p>
      <p className="text-[10px] text-mist">{k}</p>
    </div>
  );
}

function topicPrompt(t: Topic) {
  return `${t.en} (${t.bn})`;
}
