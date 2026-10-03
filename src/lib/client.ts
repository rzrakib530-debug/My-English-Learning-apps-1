"use client";

export async function postJson<T = Record<string, unknown>>(url: string, body?: unknown, method = "POST") {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "সার্ভারে সমস্যা হয়েছে");
  return data as T;
}

export async function getJson<T = Record<string, unknown>>(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "সার্ভারে সমস্যা হয়েছে");
  return data as T;
}

export function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.max(0, Math.floor(sec % 60));
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function scoreTone(score: number) {
  if (score >= 82) return { label: "চমৎকার", color: "#00c48f", ring: "ring-jam/40" };
  if (score >= 66) return { label: "ভালো চলছে", color: "#56b8ff", ring: "ring-sky/40" };
  if (score >= 48) return { label: "আরও প্র্যাকটিস দরকার", color: "#ffb020", ring: "ring-saffron/40" };
  return { label: "স্টার্ট করেছেন — ঠিক আছে", color: "#ff5d73", ring: "ring-rose/40" };
}

let cachedVoice: SpeechSynthesisVoice | null = null;
function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  cachedVoice =
    voices.find((v) => /en[-_]GB/i.test(v.lang) && /female|serena|libby|sonia/i.test(v.name)) ||
    voices.find((v) => /en[-_](US|GB|AU|IN)/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    null;
  return cachedVoice;
}

/** Text-to-speech (used by shadowing + role play + AI tutor) */
export function speak(text: string, opts: { rate?: number; onEnd?: () => void } = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    opts.onEnd?.();
    return false;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate ?? 0.95;
  u.pitch = 1;
  const v = pickVoice();
  if (v) u.voice = v;
  if (opts.onEnd) {
    u.onend = () => opts.onEnd?.();
    u.onerror = () => opts.onEnd?.();
  }
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}

export const LEVEL_LABEL: Record<string, string> = {
  beginner: "নতুন (Beginner)",
  intermediate: "মাঝারি (Intermediate)",
  advanced: "অ্যাডভান্সড",
};

export const KIND_LABEL: Record<string, string> = {
  speak: "স্পিকিং টাস্ক",
  shadow: "শ্যাডোয়িং",
  vocab: "ফ্ল্যাশকার্ড",
  grammar: "গ্রামার",
  roleplay: "রোল-প্লে",
  call: "ভয়েস কল",
};
