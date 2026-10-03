"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { postJson } from "@/lib/client";

export const NAV = [
  { href: "/dashboard", label: "হোম", icon: "🏠" },
  { href: "/speak", label: "স্পিকিং ল্যাব", icon: "🎙️" },
  { href: "/call", label: "ভয়েস কল", icon: "📞" },
  { href: "/shadow", label: "শ্যাডোয়িং", icon: "🔁" },
  { href: "/roleplay", label: "রোল-প্লে", icon: "🎭" },
  { href: "/grammar", label: "গ্রামার", icon: "📐" },
  { href: "/vocab", label: "শব্দভাণ্ডার", icon: "🃏" },
  { href: "/progress", label: "প্রগ্রেস", icon: "📊" },
];

type Pulse = { online: number; waiting: number };

export function usePulse(): Pulse {
  const [pulse, setPulse] = useState<Pulse>({ online: 0, waiting: 0 });
  useEffect(() => {
    let dead = false;
    const beat = async () => {
      try {
        const r = await postJson<Pulse>("/api/pulse");
        if (!dead) setPulse({ online: Number(r.online) || 0, waiting: Number(r.waiting) || 0 });
      } catch {
        /* ignore */
      }
    };
    beat();
    const id = window.setInterval(beat, 20000);
    return () => {
      dead = true;
      window.clearInterval(id);
    };
  }, []);
  return pulse;
}

export function Shell({
  user,
  todayMinutes,
  goalMinutes,
  children,
}: {
  user: { name: string; level: string; xp: number; streak: number };
  todayMinutes: number;
  goalMinutes: number;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const pulse = usePulse();
  const pct = Math.min(100, Math.round((todayMinutes / Math.max(1, goalMinutes)) * 100));

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-3 pb-24 pt-3 sm:px-5 lg:pb-8">
      {/* sidebar */}
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[264px] shrink-0 flex-col lg:flex">
        <Link href="/dashboard" className="panel mb-4 flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-jam text-xl text-[#04150f] shadow-[0_14px_30px_-14px_rgba(0,196,143,0.9)]">
            <BoltIcon />
          </span>
          <span>
            <span className="font-display block text-[17px] font-bold leading-none">
              বলো<span className="grad-text">English</span>
            </span>
            <span className="bangla mt-1 block text-[11px] text-mist">ইংরেজি কথা বলার জিম</span>
          </span>
        </Link>

        <nav className="panel flex-1 space-y-1 overflow-y-auto p-2.5">
          {NAV.map((n) => {
            const active = path === n.href || path.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active ? "bg-jam/15 text-chalk ring-1 ring-jam/40" : "text-mist hover:bg-panel-2 hover:text-chalk"
                }`}
              >
                <span className="text-base">{n.icon}</span>
                <span className="bangla">{n.label}</span>
                {n.href === "/call" && pulse.online > 0 ? (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-jam">
                    <span className="h-1.5 w-1.5 animate-blink rounded-full bg-jam" />
                    {pulse.online}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="panel mt-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm font-bold">{user.name}</p>
              <p className="bangla text-[11px] text-mist">{user.level}</p>
            </div>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/");
              }}
              className="bangla rounded-full border border-line px-2.5 py-1 text-[11px] text-mist hover:border-rose/50 hover:text-rose"
            >
              সাইন আউট
            </button>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[11px] text-mist">
              <span className="bangla">আজকের লক্ষ্য</span>
              <span className="font-display font-bold text-jam">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-panel-2">
              <div className="h-full rounded-full bg-gradient-to-r from-jam-deep via-jam to-saffron" style={{ width: `${pct}%`, transition: "width 700ms ease" }} />
            </div>
            <p className="bangla mt-2 text-[11px] text-mist">
              {todayMinutes} / {goalMinutes} মিনিট · {user.xp} XP · 🔥 {user.streak} দিন
            </p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* mobile top bar */}
        <header className="panel mb-4 flex items-center justify-between gap-2 p-3 lg:hidden">
          <Link href="/dashboard" className="font-display text-base font-bold">
            বলো<span className="grad-text">English</span>
          </Link>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="bangla rounded-full border border-line px-2 py-1 text-mist">🔥 {user.streak}</span>
            <span className="bangla rounded-full border border-jam/40 bg-jam/10 px-2 py-1 text-jam">{user.xp} XP</span>
          </div>
        </header>
        <main className="animate-rise">{children}</main>

        {/* mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 px-2 py-2 backdrop-blur lg:hidden">
          <div className="flex gap-1 overflow-x-auto">
            {NAV.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex min-w-[68px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold ${
                    active ? "bg-jam/15 text-jam" : "text-mist"
                  }`}
                >
                  <span className="text-base">{n.icon}</span>
                  <span className="bangla">{n.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13c0-4 3-7 7-7s7 3 7 7-3 7-7 7H9l-4 3v-6z" />
      <path d="M12 8.5v5M9.8 11.8 12 8.5l2.2 3.3" />
    </svg>
  );
}
