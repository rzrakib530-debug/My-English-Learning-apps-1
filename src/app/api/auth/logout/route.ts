import { NextResponse } from "next/server";
import { clearSessionToken, getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const me = await getSessionUser();
  await clearSessionToken();
  return NextResponse.json({ ok: true, signedOut: Boolean(me) });
}
