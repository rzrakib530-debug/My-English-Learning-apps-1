import { NextResponse } from "next/server";
import { analyzeSpeech } from "@/lib/analyze";

export const dynamic = "force-dynamic";

/** Server-side coach: run the rule engine on a spoken transcript */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const transcript = String(body.transcript ?? "").trim();
  const seconds = Math.min(1800, Math.max(1, Number(body.seconds) || 30));
  if (transcript.split(/\s+/).filter(Boolean).length < 3) {
    return NextResponse.json({ error: "কমপক্ষে ৩টা শব্দ বলুন — তারপর ফিডব্যাক পাবেন।" }, { status: 400 });
  }
  return NextResponse.json({ analysis: analyzeSpeech(transcript, seconds) });
}
