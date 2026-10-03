"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Btn, Panel, Pill, SectionTitle } from "@/components/ui";
import { getJson, postJson, fmtTime, LEVEL_LABEL } from "@/lib/client";
import { CALL_TOPICS, SENTENCE_PACKS } from "@/lib/content";
import { usePulse } from "@/components/Shell";
import { useRouter } from "next/navigation";

const TURN_URL = process.env.NEXT_PUBLIC_TURN_URL;
const ICE: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];
if (TURN_URL) {
  ICE.push({
    urls: TURN_URL,
    username: process.env.NEXT_PUBLIC_TURN_USER ?? "",
    credential: process.env.NEXT_PUBLIC_TURN_PASS ?? "",
  });
}

type Room = { id: string; status: string; topic: string | null; hostId: string; guestId: string | null; level?: string | null };
type Partner = { name: string; level: string; xp: number; streak: number } | null;
type Msg = { me: boolean; text: string; at: number };
type Phase = "lobby" | "waiting" | "connecting" | "live" | "ended";

const CALL_LIMIT = 300; // 5 minutes per round

export function CallRoom({ me, autoJoin }: { me: { id: string; name: string; level: string }; autoJoin?: string }) {
  const router = useRouter();
  const pulse = usePulse();
  const [phase, setPhase] = useState<Phase>("lobby");
  const [room, setRoom] = useState<Room | null>(null);
  const [role, setRole] = useState<"host" | "guest">("host");
  const [partner, setPartner] = useState<Partner>(null);
  const [conn, setConn] = useState<"new" | "connecting" | "connected" | "failed" | "disconnected">("new");
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [localLevel, setLocalLevel] = useState(0);
  const [remoteLevel, setRemoteLevel] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [topic, setTopic] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [openRooms, setOpenRooms] = useState<{ id: string; hostName: string; level: string | null; topic: string | null; minutesAgo: number }[]>([]);
  const [stars, setStars] = useState(0);
  const [rated, setRated] = useState(false);
  const [floaters, setFloaters] = useState<{ id: number; emoji: string; me: boolean }[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);
  const pollRef = useRef<number | undefined>(undefined);
  const tickRef = useRef<number | undefined>(undefined);
  const cursorRef = useRef(0);
  const startedRef = useRef(false);
  const roomRef = useRef<Room | null>(null);
  roomRef.current = room;
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;
  const [lastResult, setLastResult] = useState<{ seconds: number; xp: number } | null>(null);

  const send = useCallback(async (kind: string, payload: unknown) => {
    const code = roomRef.current?.id;
    if (!code) return;
    await postJson(`/api/rooms/${code}/signals`, { kind, payload }).catch(() => undefined);
  }, []);

  /* ---------------- local mic + level meters ---------------- */
  const startMeter = useCallback((stream: MediaStream, which: "local" | "remote") => {
    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext();
      const actx = ctxRef.current;
      const src = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128) / 128);
        if (which === "local") setLocalLevel((p) => p * 0.6 + Math.min(1, peak * 2.4) * 0.4);
        else setRemoteLevel((p) => p * 0.6 + Math.min(1, peak * 2.4) * 0.4);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* meter is optional */
    }
  }, []);

  const getLocal = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    localStreamRef.current = stream;
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = stream;
      localAudioRef.current.muted = true;
    }
    startMeter(stream, "local");
    return stream;
  }, [startMeter]);

  /* ---------------- peer connection ---------------- */
  const ensurePc = useCallback(async () => {
    if (pcRef.current) return pcRef.current;
    const stream = await getLocal();
    const pc = new RTCPeerConnection({ iceServers: ICE, iceCandidatePoolSize: 4 });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.onicecandidate = (e) => {
      if (e.candidate) void send("ice", { candidate: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => {
      const rs = e.streams[0] ?? new MediaStream([e.track]);
      remoteStreamRef.current = rs;
      setRemoteLevelLive(rs);
      if (audioElRef.current) {
        audioElRef.current.srcObject = rs;
        void audioElRef.current.play().catch(() => undefined);
      }
    };
    pc.onconnectionstatechange = () => setConn(pc.connectionState as typeof conn);
    pcRef.current = pc;
    return pc;
  }, [getLocal, send]);

  const setRemoteLevelLive = (rs: MediaStream) => {
    startMeter(rs, "remote");
    if (rs.getAudioTracks()[0]) rs.getAudioTracks()[0].onunmute = () => undefined;
  };

  const applyPendingIce = async (pc: RTCPeerConnection) => {
    const q = pendingIce.current;
    pendingIce.current = [];
    for (const c of q) await pc.addIceCandidate(c).catch(() => undefined);
  };
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);

  const handleSignal = useCallback(
    async (s: { kind: string; payload: Record<string, unknown>; from: string }) => {
      const pc = pcRef.current;
      if (s.kind === "offer") {
        const peer = await ensurePc();
        await peer.setRemoteDescription(new RTCSessionDescription(s.payload.sdp as RTCSessionDescriptionInit));
        await applyPendingIce(peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await send("answer", { sdp: answer });
        setConn("connected");
      } else if (s.kind === "answer") {
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(s.payload.sdp as RTCSessionDescriptionInit));
        await applyPendingIce(pc);
        setConn("connected");
      } else if (s.kind === "ice") {
        const cand = s.payload.candidate as RTCIceCandidateInit;
        if (pc && pc.remoteDescription) await pc.addIceCandidate(cand).catch(() => undefined);
        else if (cand) pendingIce.current.push(cand);
      } else if (s.kind === "chat") {
        const text = String(s.payload.text ?? "");
        if (text.startsWith("TOPIC:::")) setTopic(text.slice(8));
        else if (text) setMessages((m) => [...m.slice(-60), { me: false, text, at: Date.now() }]);
      } else if (s.kind === "react") {
        pushFloater(String(s.payload.emoji ?? "👏"), false);
      } else if (s.kind === "end") {
        pushFloater("👋", false);
        setPhase("ended");
      }
    },
    [ensurePc, send],
  );

  const pushFloater = (emoji: string, isMe: boolean) => {
    const id = Date.now() + Math.random();
    setFloaters((f) => [...f.slice(-8), { id, emoji, me: isMe }]);
    window.setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 2200);
  };

  /* ---------------- polling ---------------- */
  const startPolling = useCallback(() => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      const code = roomRef.current?.id;
      if (!code) return;
      const r = await getJson<{ signals?: { kind: string; payload: Record<string, unknown>; from: string }[]; cursor?: number; ended?: boolean }>(
        `/api/rooms/${code}/signals?after=${cursorRef.current}`,
      ).catch(() => null);
      if (!r) return;
      cursorRef.current = r.cursor ?? cursorRef.current;
      for (const s of r.signals ?? []) await handleSignal(s);
      if (r.ended) {
        setPhase((p) => (p === "live" || p === "connecting" ? "ended" : p));
      }
      // lobby matching: did someone just join my waiting room?
      if (phaseRef.current === "waiting" && !startedRef.current) {
        const info = await getJson<{ room: Room; partner: Partner }>(`/api/rooms/${code}`).catch(() => null);
        if (info?.room?.guestId) {
          startedRef.current = true;
          setRoom(info.room);
          setPartner(info.partner ?? null);
          setPhase("connecting");
          const pc = await ensurePc();
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await send("offer", { sdp: offer });
          startTimer();
          window.setTimeout(() => setPhase("live"), 1200);
        }
      }
    }, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSignal]);

  const startTimer = () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  /* ---------------- actions ---------------- */
  async function findPartner() {
    setErr(null);
    try {
      const res = await postJson<{ room: Room; role: "host" | "guest"; waiting?: boolean }>("/api/rooms", { mode: "find" });
      setRoom(res.room);
      setRole(res.role);
      setTopic((res.room.topic ?? "").replace(" ||| ", " · "));
      if (res.waiting) {
        setPhase("waiting");
        await getLocal();
        startPolling();
      } else {
        const info = await getJson<{ partner: Partner }>(`/api/rooms/${res.room.id}`);
        setPartner(info.partner ?? null);
        await beginAsGuest(res.room.id);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ম্যাচ খুঁজে পাওয়া যায়নি");
    }
  }

  async function createRoom() {
    setErr(null);
    try {
      const res = await postJson<{ room: Room }>("/api/rooms", { mode: "create", level: me.level });
      setRoom(res.room);
      setRole("host");
      setTopic((res.room.topic ?? "").replace(" ||| ", " · "));
      setPhase("waiting");
      await getLocal();
      startPolling();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "রুম তৈরি হয়নি");
    }
  }

  async function joinByCode(code: string) {
    setErr(null);
    try {
      const res = await postJson<{ room: Room }>("/api/rooms", { mode: "join", code });
      setRoom(res.room);
      setRole("guest");
      setTopic((res.room.topic ?? "").replace(" ||| ", " · "));
      const info = await getJson<{ partner: Partner }>(`/api/rooms/${res.room.id}`);
      setPartner(info.partner ?? null);
      await beginAsGuest(res.room.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "যোগ দেওয়া যায়নি");
    }
  }

  async function beginAsGuest(code: string) {
    if (startedRef.current) return;
    startedRef.current = true;
    setPhase("connecting");
    const pc = await ensurePc();
    void pc;
    startPolling();
    startTimer();
    window.setTimeout(() => setPhase((p) => (p === "connecting" ? "live" : p)), 3500);
    void code;
  }

  // restore a room after refresh
  useEffect(() => {
    if (autoJoin) {
      void joinByCode(autoJoin);
      return;
    }
    void (async () => {
      const r = await getJson<{ room?: Room | null; openRooms?: typeof openRooms }>(
        "/api/rooms",
      ).catch(() => ({ room: null, openRooms: [] as typeof openRooms }));
      if (r.openRooms) setOpenRooms(r.openRooms);
      if (r.room && r.room.status !== "ended") {
        setRoom(r.room);
        setRole(r.room.hostId === me.id ? "host" : "guest");
        setTopic((r.room.topic ?? "").replace(" ||| ", " · "));
        if (r.room.status === "active") {
          const info = await getJson<{ partner: Partner }>(`/api/rooms/${r.room!.id}`).catch(() => ({ partner: null }));
          setPartner(info.partner);
          await beginAsGuest(r.room.id);
        } else {
          setPhase("waiting");
          startPolling();
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "lobby") return;
    const id = window.setInterval(async () => {
      const r = await getJson<{ openRooms?: typeof openRooms }>("/api/rooms").catch(() => null);
      if (r?.openRooms) setOpenRooms(r.openRooms);
    }, 12000);
    return () => window.clearInterval(id);
  }, [phase]);

  const leave = useCallback(async () => {
    const code = roomRef.current?.id;
    if (code) {
      await send("end", {}).catch(() => undefined);
      const r: { seconds?: number; xp?: number } = await postJson<{ seconds?: number; xp?: number }>(
        `/api/rooms/${code}`,
        { action: "leave" },
      ).catch(() => ({}));
      setLastResult({ seconds: Number(r.seconds ?? elapsed) || elapsed, xp: Number(r.xp) || 0 });
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (tickRef.current) window.clearInterval(tickRef.current);
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setPhase("ended");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, send]);

  useEffect(() => {
    if (phase === "live" && elapsed >= CALL_LIMIT) void leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, phase]);

  /* cleanup */
  const teardown = useCallback(() => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    if (tickRef.current) window.clearInterval(tickRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    pollRef.current = undefined;
    tickRef.current = undefined;
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    void ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    startedRef.current = false;
  }, []);

  useEffect(() => {
    const onUnload = () => {
      const code = roomRef.current?.id;
      if (code && roomRef.current?.status !== "ended") {
        navigator.sendBeacon?.(`/api/rooms/${code}`, new Blob([JSON.stringify({ action: "leave" })], { type: "application/json" }));
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      teardown();
    };
  }, [teardown]);

  async function toggleMute() {
    const s = localStreamRef.current;
    if (!s) return;
    const next = !muted;
    s.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  }

  async function shuffleTopic() {
    const t = CALL_TOPICS[Math.floor(Math.random() * CALL_TOPICS.length)];
    const text = `${t.en} · ${t.bn}`;
    setTopic(text);
    if (room) await postJson(`/api/rooms/${room.id}`, { action: "topic", topic: `${t.en} ||| ${t.bn}` }).catch(() => undefined);
    await send("chat", { text: `TOPIC:::${text}` });
  }

  async function sendMsg() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMessages((m) => [...m, { me: true, text, at: Date.now() }]);
    await send("chat", { text });
  }

  async function rate() {
    if (!room || !stars) return;
    await postJson(`/api/rooms/${room.id}`, { action: "rate", stars }).catch(() => undefined);
    setRated(true);
    router.refresh();
  }

  const inCall = phase === "connecting" || phase === "live";

  return (
    <div className="space-y-5">
      <audio ref={audioElRef} autoPlay playsInline className="hidden" />
      <audio ref={localAudioRef} muted playsInline className="hidden" />

      {/* LOBBY */}
      {phase === "lobby" ? (
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Panel>
            <SectionTitle
              title="📞 লাইভ ভয়েস কল লবি"
              sub="একজন অচেনা (আপনার মতোই) লার্নারের সাথে ৫ মিনিট ইংরেজিতে কথা বলুন।"
              right={<Pill tone="sky">{pulse.online} অনলাইন · {pulse.waiting} অপেক্ষমাণ</Pill>}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={findPartner} className="panel card-hover bg-gradient-to-br from-jam/15 to-transparent p-5 text-left">
                <p className="text-2xl">🤝</p>
                <p className="bangla mt-2 font-display text-lg font-bold">পার্টনার খুঁজুন</p>
                <p className="bangla mt-1 text-[12px] leading-6 text-mist">
                  যিনি অপেক্ষা করছেন তাঁর সাথে অটো-ম্যাচ। না পেলে আপনি নিজেকে লবিতে রেজিস্টার হয়ে যাবেন।
                </p>
              </button>
              <button onClick={createRoom} className="panel card-hover bg-gradient-to-br from-saffron/15 to-transparent p-5 text-left">
                <p className="text-2xl">🚪</p>
                <p className="bangla mt-2 font-display text-lg font-bold">নিজের রুম খুলুন</p>
                <p className="bangla mt-1 text-[12px] leading-6 text-mist">
                  ৫-অক্ষরের কোড পাবেন — বন্ধুকে/গ্রুপে পাঠান, ওরা কোড দিয়ে ঢুকবে।
                </p>
              </button>
            </div>
            <CodeJoin onJoin={joinByCode} />

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="bangla text-[11px] font-bold uppercase tracking-wider text-mist">এখন যেসব রুম খোলা</p>
                <span className="bangla text-[11px] text-mist">{openRooms.length} টা</span>
              </div>
              {openRooms.length === 0 ? (
                <p className="bangla mt-2 rounded-xl border border-dashed border-line p-3 text-[12px] leading-6 text-mist">
                  কেউ অপেক্ষা করছে না — “পার্টনার খুঁজুন” চাপলে আপনি লবিতে রেজিস্টার হয়ে যাবেন, আরেকজন ঢুকলেই কল শুরু।
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {openRooms.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel-2/50 px-3 py-2">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-jam/12">🧑</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {r.hostName} <span className="bangla text-[11px] font-normal text-mist">· {r.level ?? "any"}</span>
                        </span>
                        <span className="bangla block truncate text-[11px] text-mist">
                          {(r.topic ?? "").split(" ||| ")[0] || "free talk"} · {r.minutesAgo} মিনিট আগে
                        </span>
                      </span>
                      <Btn tone="primary" onClick={() => joinByCode(r.id)}>যোগ দিন</Btn>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {err ? <p className="bangla mt-3 rounded-xl border border-rose/40 bg-rose/10 p-3 text-[12px] text-rose">{err}</p> : null}
            <div className="bangla mt-4 rounded-xl border border-line bg-panel-2/50 p-3.5 text-[12px] leading-6 text-mist">
              🔐 অডিও সরাসরি browser-to-browser (WebRTC) যায় — আমাদের সার্ভারে শুধু call setup তথ্য আর chat যায়, কল শেষ হলেই মুছে যায়।
              ভালো ফলাফলের জন্য Chrome/Edge + হেডফোন ব্যবহার করুন।
            </div>
          </Panel>
          <Panel>
            <SectionTitle title="কল শুরুর আগে" sub="এই ৩টা দেখে নিন" />
            <ol className="bangla space-y-2 text-[13px] leading-7 text-mist">
              <li className="rounded-xl border border-line bg-panel-2/40 p-3">১️⃣ নিজের একটা পরিচয় ২০ সেকেন্ডে বলুন: name, city, job/study, কেন English প্র্যাকটিস করছেন।</li>
              <li className="rounded-xl border border-line bg-panel-2/40 p-3">২️⃣ টপিক কার্ড ব্যবহার করুন — প্রশ্ন করুন, উত্তরে “why?” জিজ্ঞেস করুন।</li>
              <li className="rounded-xl border border-line bg-panel-2/40 p-3">৩️⃣ শেষ ৩০ সেকেন্ডে একে অপরকে একটি করে feedback দিন: কী ভালো ছিল, কী ঠিক করলে ভালো হতো।</li>
            </ol>
            <div className="mt-4 rounded-xl border border-line bg-canvas/60 p-3.5">
              <p className="bangla text-[11px] font-bold text-jam">আটকে গেলে এগুলো বলুন</p>
              <ul className="mt-2 space-y-1.5">
                {SENTENCE_PACKS.map((s) => (
                  <li key={s.from} className="flex justify-between gap-3 text-[12px]">
                    <span className="bangla text-mist">{s.from}</span>
                    <span className="font-display text-right text-chalk">{s.to}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </div>
      ) : null}

      {/* WAITING */}
      {phase === "waiting" && room ? (
        <Panel className="text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-jam/12">
            <span className="relative grid h-16 w-16 place-items-center rounded-full bg-jam/20 text-3xl">
              <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-jam/60" />
              🎧
            </span>
          </div>
          <p className="bangla mt-4 font-display text-xl font-bold">পার্টনার খোঁজা হচ্ছে…</p>
          <p className="bangla mt-1 text-sm text-mist">
            আপনার রুম কোড <span className="font-display text-jam">{room.id}</span> — এটা শেয়ার করলেই কেউ ঢুকতে পারবে।
          </p>
          <div className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-center gap-2">
            <Btn tone="ghost" onClick={() => void navigator.clipboard?.writeText(room.id)}>📋 কোড কপি</Btn>
            <Btn
              tone="danger"
              onClick={async () => {
                if (room) await postJson(`/api/rooms/${room.id}`, { action: "leave" }).catch(() => undefined);
                teardown();
                setRoom(null);
                setPhase("lobby");
              }}
            >
              বাতিল করুন
            </Btn>
          </div>
          <p className="bangla mt-4 text-[12px] text-mist">
            এদিকে বসে থাকাটাও প্র্যাকটিস — নিচের চেকলিস্টটা চুপিচুপি বলুন: My name is… I&apos;m from… I want to improve…
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <LevelBadge level={me.level} />
            <LevelBadge level={room.level ?? "any"} />
          </div>
        </Panel>
      ) : null}

      {/* LIVE */}
      {inCall ? (
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative grid h-12 w-12 place-items-center rounded-full bg-jam/15 text-xl">
                  🧑
                  {conn === "connected" ? <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-panel bg-jam" /> : null}
                </span>
                <span className="text-2xl">⇄</span>
                <span className="relative grid h-12 w-12 place-items-center rounded-full bg-sky/15 text-xl">
                  {partner ? "🧕" : "❔"}
                  {partner ? null : <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-blink rounded-full border-2 border-panel bg-saffron" />}
                </span>
                <div>
                  <p className="font-display text-base font-bold">{partner ? partner.name : "পার্টনারের জন্য অপেক্ষা"}</p>
                  <p className="bangla text-[11px] text-mist">
                    {partner ? `${LEVEL_LABEL[partner.level] ?? partner.level} · ${partner.xp} XP · 🔥${partner.streak}` : "রুম কোড " + (room?.id ?? "")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-jam">{fmtTime(Math.max(0, CALL_LIMIT - elapsed))}</p>
                <p className="bangla text-[11px] text-mist">বাকি · {conn}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl border border-line bg-canvas/60 p-4">
              <div>
                <p className="bangla text-[11px] font-bold text-mist">🎙️ আপনি</p>
                <Bars level={muted ? 0 : localLevel} color="#00c48f" />
              </div>
              <div>
                <p className="bangla text-[11px] font-bold text-mist">🔊 পার্টনার</p>
                <Bars level={remoteLevel} color="#56b8ff" />
              </div>
            </div>

            {conn !== "connected" ? (
              <p className="bangla mt-3 rounded-xl border border-saffron/40 bg-saffron/10 p-3 text-[12px] leading-6 text-saffron">
                {partner
                  ? "⚠️ অডিও পাথ এখনো তৈরি হয়নি — একই Wi-Fi-তে দুই ট্যাব খুললে সহজ কানেক্ট হয়। চ্যাট এখনো কাজ করছে, তাই প্র্যাকটিস আটকাবে না।"
                  : "⏳ পার্টনারের ট্যাব থেকে এখনো সাড়া আসেনি — উনি পেজ রিলোড করলে সঙ্গে সঙ্গে কানেক্ট হয়ে যাবে।"}
              </p>
            ) : null}

            <div className="mt-4 rounded-2xl border border-jam/30 bg-jam/[0.07] p-4">
              <div className="flex items-center justify-between">
                <p className="bangla text-[11px] font-bold text-jam">আজকের conversation topic</p>
                <button onClick={shuffleTopic} className="bangla rounded-full border border-jam/40 px-2.5 py-1 text-[11px] font-bold text-jam">🎲 অন্য টপিক</button>
              </div>
              <p className="font-display mt-1.5 text-[15px] font-semibold leading-snug">{topic || "Free talk — start by introducing yourself!"}</p>
              <ul className="bangla mt-3 grid gap-1 text-[12px] leading-6 text-mist sm:grid-cols-2">
                {["What do you do all day?", "What is the hardest part of English for you?", "Tell me about your hometown.", "What did you do last weekend?", "One thing you want to change in your city?", "When do you feel most confident?"].map((q) => (
                  <li key={q}>💬 {q}</li>
                ))}
              </ul>
            </div>

            <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2">
              {floaters.map((f) => (
                <span key={f.id} className="animate-floaty pointer-events-none absolute -top-8 text-2xl" style={{ left: `${f.me ? 30 : 62}%` }}>
                  {f.emoji}
                </span>
              ))}
              <Btn tone={muted ? "danger" : "ghost"} onClick={toggleMute}>{muted ? "🔇 আনমিউট" : "🎙️ মিউট"}</Btn>
              {["👏", "😂", "👍", "🤔"].map((e) => (
                <button key={e} onClick={() => { pushFloater(e, true); void send("react", { emoji: e }); }} className="h-9 w-9 rounded-full border border-line bg-panel-2/60 text-base hover:border-jam/50">
                  {e}
                </button>
              ))}
              <Btn tone="danger" onClick={leave}>📞 কল শেষ</Btn>
            </div>
            {elapsed > CALL_LIMIT - 60 && phase === "live" ? (
              <p className="bangla mt-3 rounded-xl border border-saffron/40 bg-saffron/10 p-2.5 text-center text-[12px] text-saffron">
                শেষ ১ মিনিট — এখন একে অপরকে একটি করে feedback দিন 🎁
              </p>
            ) : null}
          </Panel>

          <Panel className="flex flex-col">
            <SectionTitle title="কল চ্যাট" sub="শব্দ আটকে গেলে লিখে ফেলুন — তারপর বলুন" />
            <div className="mb-3 max-h-[260px] min-h-[120px] flex-1 space-y-2 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <p className="bangla rounded-xl border border-dashed border-line p-3 text-[12px] leading-6 text-mist">
                  এখনো কোনো মেসেজ নেই। টাইপ করে পাঠালে ওপরে দেখা যাবে (text only, audio কখনো টেক্সট হয় না)।
                </p>
              ) : null}
              {messages.map((m, i) => (
                <p key={i} className={`bangla max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-6 ${m.me ? "ml-auto bg-jam/15 text-chalk" : "bg-panel-2/70 text-mist"}`}>
                  {m.text}
                </p>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void sendMsg()}
                placeholder="type in English…"
                className="flex-1 rounded-xl border border-line bg-canvas/70 px-3 py-2 text-sm outline-none focus:border-jam"
              />
              <Btn tone="primary" onClick={sendMsg}>➤</Btn>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Sorry, can you repeat?", "I mean…", "What about you?", "Nice point!"].map((s) => (
                <button key={s} onClick={() => setDraft(s)} className="bangla rounded-full border border-line bg-panel-2/50 px-2.5 py-1 text-[11px] text-mist hover:border-jam/40">
                  {s}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}

      {/* ENDED */}
      {phase === "ended" ? (
        <Panel className="text-center">
          <p className="text-4xl">✅</p>
          <p className="bangla mt-3 font-display text-xl font-bold">কল শেষ! আজকের সবচেয়ে বড় কাজটা করে ফেললেন।</p>
          <p className="bangla mt-1 text-sm text-mist">
            {lastResult ? `${Math.round(lastResult.seconds / 60)} মিনিট কথা বলেছেন · +${lastResult.xp} XP যোগ হয়েছে` : "সেশন সেভ হয়েছে"}
          </p>
          <div className="mx-auto mt-5 max-w-md rounded-2xl border border-line bg-panel-2/50 p-4">
            <p className="bangla text-xs font-bold text-mist">পার্টনারকে রেটিং দিন</p>
            <div className="mt-2 flex justify-center gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setStars(n)} className={n <= stars ? "text-saffron" : "text-line"}>
                  ★
                </button>
              ))}
            </div>
            <Btn tone="primary" className="mt-3" onClick={rate} disabled={!stars || rated}>
              {rated ? "রেটিং জমা হয়েছে ✅" : "রেটিং পাঠান"}
            </Btn>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Btn tone="ghost" onClick={() => { teardown(); setMessages([]); setElapsed(0); setStars(0); setRated(false); setLastResult(null); setPartner(null); cursorRef.current = 0; setPhase("lobby"); }}>
              ← লবিতে ফিরুন
            </Btn>
            <Btn tone="primary" onClick={() => { teardown(); setMessages([]); setElapsed(0); setStars(0); setRated(false); cursorRef.current = 0; void findPartner(); }}>
              🔁 আরেকটা কল খুঁজুন
            </Btn>
            <Link href="/progress" className="bangla soft-btn rounded-full px-4 py-2 text-sm font-semibold">প্রগ্রেস দেখুন</Link>
          </div>
        </Panel>
      ) : null}

      {err && phase !== "lobby" ? <p className="bangla text-center text-[12px] text-rose">{err}</p> : null}
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  return <span className="bangla rounded-full border border-line bg-panel-2/60 px-3 py-1 text-[11px] text-mist">{LEVEL_LABEL[level] ?? level}</span>;
}

function Bars({ level, color }: { level: number; color: string }) {
  return (
    <div className="mt-1 flex h-9 items-center gap-[3px]">
      {Array.from({ length: 40 }).map((_, i) => {
        const w = Math.sin((i / 40) * Math.PI);
        const h = 4 + Math.max(0, level) * 30 * (0.35 + w * 0.75) * (0.6 + Math.random() * 0.6);
        return <span key={i} className="w-[3px] rounded-full" style={{ height: `${h}px`, background: color, opacity: 0.3 + level * 0.7 }} />;
      })}
    </div>
  );
}

function CodeJoin({ onJoin }: { onJoin: (code: string) => void }) {
  const [code, setCode] = useState("");
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-canvas/50 p-3">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="রুম কোড (যেমন: K7QPM)"
        maxLength={6}
        className="min-w-[180px] flex-1 rounded-xl border border-line bg-panel/70 px-3 py-2 font-display text-sm tracking-[0.2em] outline-none focus:border-jam"
      />
      <Btn tone="primary" onClick={() => onJoin(code)} disabled={code.length < 4}>
        কোড দিয়ে ঢুকুন
      </Btn>
    </div>
  );
}
