"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Panel, Pill, SectionTitle } from "@/components/ui";
import { postJson, speak } from "@/lib/client";
import { LESSONS } from "@/lib/content";

export function GrammarCamp({ level }: { level: string }) {
  const router = useRouter();
  const [lessonId, setLessonId] = useState(
    level === "advanced" ? "g4" : level === "intermediate" ? "g2" : "g1",
  );
  const [step, setStep] = useState<"learn" | "quiz">("learn");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const lesson = LESSONS.find((l) => l.id === lessonId) ?? LESSONS[0];
  const correct = lesson.quiz.filter((q, i) => answers[i] === q.answer).length;

  function reset() {
    setAnswers({});
    setChecked(false);
    setStep("learn");
  }

  async function finish() {
    const score = Math.round((100 * correct) / lesson.quiz.length);
    await postJson("/api/practice", {
      kind: "grammar",
      score,
      durationSec: 120,
      meta: { lessonId: lesson.id, correct, total: lesson.quiz.length },
    }).catch(() => undefined);
    router.refresh();
    reset();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {LESSONS.map((l) => (
          <button
            key={l.id}
            onClick={() => { setLessonId(l.id); reset(); }}
            className={`bangla rounded-full border px-3.5 py-2 text-xs font-bold transition-all ${
              l.id === lessonId ? "border-jam bg-jam/15 text-chalk" : "border-line bg-panel-2/50 text-mist hover:border-jam/40"
            }`}
          >
            {l.bnTitle}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <SectionTitle
            title={lesson.title}
            right={<Pill tone="jam">{step === "learn" ? "lesson" : "quiz"}</Pill>}
          />
          <p className="bangla rounded-2xl border border-saffron/30 bg-saffron/[0.07] p-4 text-[13px] leading-7 text-chalk">
            {lesson.summaryBn}
          </p>

          <ul className="bangla mt-4 space-y-2 text-[13px] leading-7 text-mist">
            {lesson.rules.map((r) => (
              <li key={r} className="flex gap-2 rounded-xl border border-line bg-panel-2/40 px-3 py-2">
                <span className="text-jam">▸</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2">
            {lesson.examples.map((e) => (
              <div key={e.wrong} className="rounded-xl border border-line bg-canvas/50 p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-rose line-through decoration-rose/40">{e.wrong}</span>
                  <span className="text-mist">→</span>
                  <span className="font-display font-semibold text-jam">{e.right}</span>
                  <button onClick={() => speak(e.right, { rate: 0.9 })} className="bangla rounded-full border border-line px-2 py-0.5 text-[10px] text-mist">
                    🔊
                  </button>
                </div>
                <p className="bangla mt-1 text-[12px] leading-6 text-mist">💡 {e.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between">
            <Btn tone="ghost" onClick={() => setStep(step === "learn" ? "quiz" : "learn")}>
              {step === "learn" ? "কুইজে যান →" : "← লেসন"}
            </Btn>
            <Btn tone="ghost" onClick={() => speak(lesson.examples.map((e) => e.right).join(". "), { rate: 0.92 })}>
              🔊 উদাহরণগুলো শুনুন
            </Btn>
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="কুইজ" sub={`${lesson.quiz.length} টা প্রশ্ন · সঠিক ${correct}`} />
          {step === "learn" ? (
            <p className="bangla rounded-xl border border-dashed border-line p-4 text-sm leading-7 text-mist">
              বাঁ দিকের নিয়মগুলো পড়ে নিন, তারপর কুইজে যান। প্রতিটা ভুলের ব্যাখ্যা বাংলায় দেওয়া আছে — তাড়াহুড়ো করবেন না।
            </p>
          ) : (
            <div className="space-y-4">
              {lesson.quiz.map((q, i) => {
                const picked = answers[i];
                return (
                  <div key={q.q} className="rounded-xl border border-line bg-panel-2/40 p-3.5">
                    <p className="font-display text-sm font-semibold leading-6">{i + 1}. {q.q}</p>
                    <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                      {q.options.map((o, oi) => {
                        const isPicked = picked === oi;
                        const isRight = oi === q.answer;
                        const show = checked;
                        return (
                          <button
                            key={o}
                            onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                            className={`rounded-lg border px-3 py-2 text-left text-[13px] transition-all ${
                              show && isRight
                                ? "border-jam bg-jam/15 text-jam"
                                : show && isPicked
                                  ? "border-rose bg-rose/12 text-rose"
                                  : isPicked
                                    ? "border-jam/50 bg-jam/10"
                                    : "border-line hover:border-jam/40"
                            }`}
                          >
                            {o}
                          </button>
                        );
                      })}
                    </div>
                    {checked ? (
                      <p className="bangla mt-2 rounded-lg bg-canvas/60 p-2 text-[12px] leading-6 text-mist">
                        {picked === q.answer ? "✅ " : "❌ "}
                        {q.whyBn}
                      </p>
                    ) : null}
                  </div>
                );
              })}

              {!checked ? (
                <Btn tone="primary" className="w-full" onClick={() => setChecked(true)} disabled={Object.keys(answers).length < lesson.quiz.length}>
                  উত্তর চেক করুন ({Object.keys(answers).length}/{lesson.quiz.length})
                </Btn>
              ) : (
                <div className="rounded-2xl border border-jam/35 bg-jam/[0.08] p-4 text-center">
                  <p className="font-display text-3xl font-bold text-jam">{Math.round((100 * correct) / lesson.quiz.length)}%</p>
                  <p className="bangla mt-1 text-[12px] text-mist">{correct}/{lesson.quiz.length} সঠিক</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <Btn tone="ghost" onClick={() => { setChecked(false); setAnswers({}); }}>↺ আবার</Btn>
                    <Btn tone="primary" onClick={finish}>স্কোর সেভ করুন</Btn>
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
