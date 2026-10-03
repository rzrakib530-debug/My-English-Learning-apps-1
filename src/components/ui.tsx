"use client";

import type { ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`panel p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {sub ? <p className="bangla mt-1 text-sm text-mist">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Pill({ children, tone = "mist" }: { children: ReactNode; tone?: "mist" | "jam" | "saffron" | "rose" | "sky" | "lilac" }) {
  const tones: Record<string, string> = {
    mist: "border-line bg-panel-2/70 text-mist",
    jam: "border-jam/40 bg-jam/12 text-jam",
    saffron: "border-saffron/40 bg-saffron/12 text-saffron",
    rose: "border-rose/40 bg-rose/12 text-rose",
    sky: "border-sky/40 bg-sky/12 text-sky",
    lilac: "border-lilac/40 bg-lilac/12 text-lilac",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone] ?? tones.mist}`}>
      {children}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  tone = "ghost",
  disabled,
  type = "button",
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "primary" | "ghost" | "danger" | "gold";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  title?: string;
}) {
  const tones: Record<string, string> = {
    primary:
      "bg-jam text-[#04150f] hover:bg-[#1adcaa] shadow-[0_16px_36px_-20px_rgba(0,196,143,0.9)] border border-jam/50",
    gold: "bg-saffron text-[#241700] hover:brightness-110 border border-saffron/50",
    ghost: "border border-line bg-panel-2/70 text-chalk hover:border-jam/45 hover:bg-panel-2",
    danger: "border border-rose/45 bg-rose/12 text-rose hover:bg-rose/20",
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Dial({ value, size = 132, label, sub, color = "#00c48f" }: { value: number; size?: number; label?: string; sub?: string; color?: string }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#17332c" strokeWidth={9} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.2,0.8,0.2,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl font-bold" style={{ color }}>
          {Math.round(value)}
        </div>
        {label ? <div className="bangla text-[11px] text-mist">{label}</div> : null}
        {sub ? <div className="bangla text-[11px] text-mist">{sub}</div> : null}
      </div>
    </div>
  );
}

export function Meter({ label, value, color = "#00c48f" }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="bangla text-mist">{label}</span>
        <span className="font-display font-bold" style={{ color }}>
          {Math.round(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-panel-2">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color, transition: "width 800ms cubic-bezier(0.2,0.8,0.2,1)" }}
        />
      </div>
    </div>
  );
}

/** live mic waveform driven by the 0..1 level from useDictation */
export function Wave({ level, active, bars = 28, color = "#00c48f" }: { level: number; active: boolean; bars?: number; color?: string }) {
  return (
    <div className="flex h-12 items-center gap-[3px]">
      {Array.from({ length: bars }).map((_, i) => {
        const w = Math.sin((i / bars) * Math.PI);
        const h = active ? 6 + Math.max(0, level) * 42 * (0.45 + w * 0.75) * (0.7 + Math.random() * 0.5) : 5 + w * 3;
        return (
          <span
            key={i}
            className="w-[3px] rounded-full"
            style={{ height: `${h}px`, background: color, opacity: active ? 0.35 + level * 0.65 : 0.22, transition: "height 90ms linear" }}
          />
        );
      })}
    </div>
  );
}

export function EmptyState({ emoji, title, bn }: { emoji: string; title: string; bn: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-panel/50 p-8 text-center">
      <div className="text-3xl">{emoji}</div>
      <p className="font-display mt-3 font-semibold">{title}</p>
      <p className="bangla mt-1 text-sm text-mist">{bn}</p>
    </div>
  );
}
