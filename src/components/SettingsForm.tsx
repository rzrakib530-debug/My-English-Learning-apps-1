"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Panel, SectionTitle } from "@/components/ui";
import { postJson, LEVEL_LABEL } from "@/lib/client";

export function SettingsForm({
  user,
}: {
  user: { name: string; level: string; goalMinutes: number };
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [level, setLevel] = useState(user.level);
  const [goal, setGoal] = useState(user.goalMinutes);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await postJson("/api/pulse", { name, level, goalMinutes: goal }, "PATCH").catch(() => undefined);
    setBusy(false);
    setSaved(true);
    router.refresh();
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <Panel>
      <SectionTitle title="সেটিংস" sub="লেভেল বদলালে সাজেশন আর টপিক রিকমেন্ডেশনও বদলাবে" right={saved ? <span className="bangla text-xs font-bold text-jam">সেভ হয়েছে ✅</span> : undefined} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="bangla mb-1.5 block text-xs font-semibold text-mist">নাম</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} className="w-full rounded-xl border border-line bg-canvas/70 px-3 py-2 text-sm outline-none focus:border-jam" />
          <label className="bangla mt-4 mb-1.5 block text-xs font-semibold text-mist">দৈনিক লক্ষ্য: {goal} মিনিট</label>
          <input type="range" min={5} max={90} step={5} value={goal} onChange={(e) => setGoal(Number(e.target.value))} className="h-2 w-full accent-jam" />
        </div>
        <div>
          <p className="bangla mb-1.5 text-xs font-semibold text-mist">লেভেল</p>
          <div className="space-y-1.5">
            {["beginner", "intermediate", "advanced"].map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`bangla flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                  level === l ? "border-jam bg-jam/12 text-chalk" : "border-line bg-panel-2/50 text-mist hover:border-jam/40"
                }`}
              >
                {LEVEL_LABEL[l]}
                <span>{level === l ? "✓" : ""}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Btn tone="primary" onClick={save} disabled={busy}>{busy ? "সেভ হচ্ছে…" : "পরিবর্তন সেভ করুন"}</Btn>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/");
          }}
          className="bangla rounded-full border border-line px-3 py-2 text-xs font-semibold text-mist hover:border-rose/50 hover:text-rose"
        >
          এই ডিভাইস থেকে লগ আউট
        </button>
      </div>
    </Panel>
  );
}
