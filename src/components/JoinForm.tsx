"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client";

const LEVELS = [
  { id: "beginner", label: "একেবারে নতুন", hint: "Hello, my name is… দিয়ে শুরু" },
  { id: "intermediate", label: "মাঝারি", hint: "বুঝি, কিন্তু আটকে যাই" },
  { id: "advanced", label: "ফ্লুয়েন্ট হতে চাই", hint: "accuracy + confidence দরকার" },
];

export function JoinForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [level, setLevel] = useState("beginner");
  const [goal, setGoal] = useState(20);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await postJson("/api/auth/login", { name, level, goalMinutes: goal });
      router.push("/dashboard");
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "আবার চেষ্টা করুন");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel space-y-4 p-5 sm:p-6">
      <div>
        <label className="bangla mb-1.5 block text-xs font-semibold text-mist">আপনার নাম / ডাকনাম</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="যেমন: তানিয়া / Taniya"
          maxLength={30}
          className="w-full rounded-xl border border-line bg-canvas/70 px-4 py-3 text-base outline-none transition-colors placeholder:text-mist/60 focus:border-jam"
        />
      </div>

      <div>
        <p className="bangla mb-1.5 text-xs font-semibold text-mist">এইমাত্র ইংরেজি কেমন?</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <button
              type="button"
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={`rounded-xl border p-3 text-left transition-all ${
                level === l.id ? "border-jam bg-jam/12 shadow-[0_14px_30px_-22px_rgba(0,196,143,1)]" : "border-line bg-panel-2/60 hover:border-jam/40"
              }`}
            >
              <span className="bangla block text-sm font-bold">{l.label}</span>
              <span className="bangla mt-0.5 block text-[11px] text-mist">{l.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="bangla text-xs font-semibold text-mist">দৈনিক প্র্যাকটিস লক্ষ্য</span>
          <span className="font-display text-sm font-bold text-jam">{goal} মিনিট</span>
        </div>
        <input
          type="range"
          min={5}
          max={90}
          step={5}
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-panel-2 accent-jam"
        />
      </div>

      <button
        type="submit"
        disabled={busy || name.trim().length < 2}
        className="w-full rounded-full bg-jam px-5 py-3.5 font-display text-[15px] font-bold text-[#04150f] shadow-[0_20px_44px_-20px_rgba(0,196,143,0.95)] transition-all hover:bg-[#1ae0ac] active:scale-[0.98] disabled:opacity-45"
      >
        {busy ? "তৈরি হচ্ছে…" : "ফ্রি প্র্যাকটিস শুরু করুন →"}
      </button>
      {err ? <p className="bangla text-center text-xs text-rose">{err}</p> : null}
      <p className="bangla text-center text-[11px] text-mist">
        কোনো পাসওয়ার্ড নেই, কোনো ইমেইল লাগে না। শুধু নাম দিন — প্রগ্রেস এই ব্রাউজারে সেভ থাকবে।
      </p>
    </form>
  );
}
