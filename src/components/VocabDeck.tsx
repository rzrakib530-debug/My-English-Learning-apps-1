"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Panel, Pill, SectionTitle } from "@/components/ui";
import { getJson, postJson, speak } from "@/lib/client";
import { FALSE_FRIENDS, type Card } from "@/lib/content";
import { useDictation } from "@/hooks/useDictation";

type Queue = { queue: Card[]; stats: { total: number; learned: number; due: number; reps: number } };

export function VocabDeck() {
  const router = useRouter();
  const [data, setData] = useState<Queue | null>(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [graded, setGraded] = useState(0);
  const [sum, setSum] = useState(0);
  const [sentenceFeedback, setSentenceFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getJson<Queue>("/api/review"));
    } catch {
      setData({ queue: [], stats: { total: 0, learned: 0, due: 0, reps: 0 } });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const card = data?.queue[i];
  const dict = useDictation({
    onDone: async (text) => {
      if (!card) return;
      const used = text.toLowerCase().includes(card.en.split(" ")[0].toLowerCase());
      const long = text.split(/\s+/).filter(Boolean).length >= 6;
      const ok = used && long;
      setSentenceFeedback(
        ok
          ? `দারুণ বাক্য! 👏 "${text}"`
          : used
            ? "শব্দটা ব্যবহার করেছেন, কিন্তু একটু বড় করে বলুন — subject + verb + situation থাকতে হবে।"
            : `'${card.en}' শব্দটা বাক্যের ভেতরে ব্যবহার করুন। Example: ${card.example}`,
      );
      if (ok) await postJson("/api/practice", { kind: "vocab", score: 88, durationSec: 25, meta: { cardKey: card.key, production: text } }).catch(() => undefined);
    },
  });

  async function grade(rating: number) {
    if (!card) return;
    setSum((s) => s + (rating >= 2 ? 1 : 0));
    setGraded((g) => g + 1);
    await postJson("/api/review", { cardKey: card.key, rating }).catch(() => undefined);
    const next = i + 1;
    setFlipped(false);
    if (next >= (data?.queue.length ?? 0)) {
      const score = Math.round((100 * (sum + (rating >= 2 ? 1 : 0))) / Math.max(1, graded + 1));
      await postJson("/api/practice", {
        kind: "vocab",
        score,
        durationSec: Math.max(60, (graded + 1) * 14),
        meta: { cards: graded + 1 },
      }).catch(() => undefined);
      setI(next); // finished view; "আবার শুরু" re-loads the queue
      router.refresh();
      return;
    }
    setI(next);
  }

  if (loading && !data) return <Panel>…কার্ড আনছি</Panel>;

  const stats = data?.stats;
  const finished = !card;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <SectionTitle
            title="🃏 শব্দভাণ্ডার ডেক"
            sub="Spaced repetition — যেটা ভুলবেন সেটা বারবার ফিরে আসবে, মনে থাকলে দীর্ঘ বিরতি পাবে।"
            right={<Pill tone="lilac">{stats?.due ?? 0} due</Pill>}
          />

          {finished ? (
            <div className="rounded-2xl border border-jam/35 bg-jam/10 p-6 text-center">
              <p className="text-3xl">🎉</p>
              <p className="bangla mt-2 font-display text-lg font-bold">এই রাউন্ড শেষ!</p>
              <p className="bangla mt-1 text-sm text-mist">
                {graded} কার্ড দেখেছেন, {sum} টায় উত্তর মনে ছিল · +{graded * 3} XP
              </p>
              <Btn tone="primary" className="mt-4" onClick={() => { setGraded(0); setSum(0); setI(0); setFlipped(false); void load(); }}>
                আবার শুরু / নতুন কার্ড
              </Btn>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-canvas/60 p-6 text-center">
              <p className="font-display text-[clamp(1.6rem,5vw,2.4rem)] font-bold">{card!.en}</p>
              <p className="bangla mt-1 text-xs text-mist">🔉 {card!.sound}</p>
              <button onClick={() => speak(card!.en)} className="bangla mt-2 rounded-full border border-line px-3 py-1 text-[11px] text-jam">
                উচ্চারণ শুনুন
              </button>

              {flipped ? (
                <div className="mt-4 animate-rise space-y-3 text-left">
                  <p className="bangla rounded-xl border border-jam/30 bg-jam/[0.07] p-3 text-sm leading-7">
                    <span className="font-bold text-jam">{card!.bn}</span>
                  </p>
                  <p className="font-display rounded-xl border border-line bg-panel-2/60 p-3 text-sm leading-7 text-chalk">
                    “{card!.example}”
                    <button onClick={() => speak(card!.example)} className="bangla ml-2 text-[11px] text-jam">🔊</button>
                  </p>

                  <div className="rounded-xl border border-line bg-panel-2/40 p-3">
                    <p className="bangla text-[11px] font-bold text-sky">✍️ নিজে বাক্য বানান (মাইকে)</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => (dict.listening ? dict.stop() : dict.start())}
                        className={`grid h-10 w-10 place-items-center rounded-full ${dict.listening ? "bg-rose text-[#2a0206]" : "bg-jam text-[#04150f]"}`}
                      >
                        {dict.listening ? "⏹" : "🎤"}
                      </button>
                      <p className="bangla flex-1 text-[12px] leading-6 text-mist">
                        {dict.transcript || `${card!.en} শব্দটা দিয়ে একটা নিজের বাক্য বলুন (৬+ শব্দ)`}
                      </p>
                    </div>
                    {sentenceFeedback ? <p className="bangla mt-2 text-[12px] leading-6 text-jam">{sentenceFeedback}</p> : null}
                    {dict.error ? <p className="bangla mt-2 text-[12px] text-rose">{dict.error}</p> : null}
                  </div>
                </div>
              ) : (
                <p className="bangla mt-4 text-sm text-mist">মনে আছে? উল্টোপাশে মানে আর উদাহরণ আছে।</p>
              )}

              <div className="mt-5 flex justify-center gap-2">
                {!flipped ? (
                  <Btn tone="primary" onClick={() => setFlipped(true)}>মানে দেখুন</Btn>
                ) : (
                  <div className="grid w-full grid-cols-4 gap-2">
                    {[
                      { r: 0, l: "ভুলে গেছি", c: "border-rose/45 text-rose" },
                      { r: 1, l: "কঠিন", c: "border-saffron/45 text-saffron" },
                      { r: 2, l: "ঠিক আছে", c: "border-sky/45 text-sky" },
                      { r: 3, l: "সহজ", c: "border-jam/45 text-jam" },
                    ].map((b) => (
                      <button
                        key={b.r}
                        onClick={() => grade(b.r)}
                        className={`bangla rounded-xl border bg-panel-2/60 px-2 py-2.5 text-[12px] font-bold transition-all hover:-translate-y-0.5 ${b.c}`}
                      >
                        {b.l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel>
            <SectionTitle title="অগ্রগতি" sub="ডেক জুড়ে আপনার অবস্থা" />
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { k: "মোট", v: stats?.total ?? 0 },
                { k: "ডু", v: stats?.due ?? 0 },
                { k: "শেখা", v: stats?.learned ?? 0 },
                { k: "রিভিউ", v: stats?.reps ?? 0 },
              ].map((s) => (
                <div key={s.k} className="rounded-xl border border-line bg-panel-2/50 p-3">
                  <p className="font-display text-lg font-bold text-jam">{s.v}</p>
                  <p className="bangla text-[10px] text-mist">{s.k}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="🇧🇩 বাংলা অনুবাদে সাধারণ ফাঁদ" sub="এগুলো ঠিক করলেই কথা প্রাকৃতিক শোনাতে শুরু করবে" />
            <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {FALSE_FRIENDS.map((f) => (
                <li key={f.bangla} className="rounded-xl border border-line bg-panel-2/50 p-3">
                  <p className="bangla text-[11px] text-mist">{f.bangla}</p>
                  <p className="mt-1 text-[13px] text-rose line-through decoration-rose/40">{f.literal}</p>
                  <p className="font-display text-[13px] font-bold text-jam">{f.natural}</p>
                  <p className="bangla mt-1 text-[11px] leading-6 text-mist">{f.whyBn}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
