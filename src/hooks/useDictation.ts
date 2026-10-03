"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Minimal Web Speech types (TS has no global defs for webkit prefixed APIs) */
type Alt = { transcript: string; confidence: number };
type Result = { isFinal: boolean; length: number; 0: Alt; [i: number]: Alt };
type ResultEvent = { resultIndex: number; results: { length: number; [i: number]: Result } };
type Recog = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: ResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getCtor(): (new () => Recog) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recog; webkitSpeechRecognition?: new () => Recog };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useDictation(opts: { maxSeconds?: number; onDone?: (transcript: string, seconds: number) => void } = {}) {
  const supported = Boolean(getCtor());
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recogRef = useRef<Recog | null>(null);
  const finalRef = useRef("");
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);
  const tickRef = useRef<number | undefined>(undefined);
  const startedRef = useRef(0);
  const doneRef = useRef(opts.onDone);
  doneRef.current = opts.onDone;

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = undefined;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setLevel(0);
  }, []);

  const stop = useCallback(
    (opts2: { silent?: boolean } = {}) => {
      try {
        recogRef.current?.stop();
      } catch {
        /* already stopped */
      }
      recogRef.current = null;
      setListening(false);
      setInterim("");
      cleanup();
      const secs = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000));
      if (!opts2.silent) doneRef.current?.(finalRef.current.trim(), secs);
      return { text: finalRef.current.trim(), seconds: secs };
    },
    [cleanup],
  );

  const start = useCallback(
    async (initial = "") => {
      setError(null);
      finalRef.current = initial.trim();
      setTranscript(finalRef.current);
      startedRef.current = Date.now();
      setSeconds(0);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        streamRef.current = stream;
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const actx = new Ctx();
        ctxRef.current = actx;
        const src = actx.createMediaStreamSource(stream);
        const analyser = actx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          analyser.getByteTimeDomainData(buf);
          let peak = 0;
          for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128) / 128);
          setLevel((prev) => prev * 0.55 + Math.min(1, peak * 2.6) * 0.45);
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        setError("মাইক্রোফোন চালু হয়নি — ব্রাউজারে mic permission দিন, অথবা টাইপ করে প্র্যাকটিস করুন।");
      }

      const Ctor = getCtor();
      if (Ctor) {
        const r = new Ctor();
        r.continuous = true;
        r.interimResults = true;
        r.lang = "en-US";
        r.maxAlternatives = 1;
        r.onresult = (e) => {
          let live = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            const text = res[0].transcript;
            if (res.isFinal) finalRef.current = (finalRef.current + " " + text).trim();
            else live += text;
          }
          setTranscript(finalRef.current);
          setInterim(live);
        };
        r.onerror = (e) => {
          if (e.error === "not-allowed") setError("মাইক্রোফোন পারমিশন বন্ধ আছে — ব্রাউজার সেটিংসে allow করুন।");
          else if (e.error === "no-speech") setError("কোনো কথা শোনা যায়নি — স্পষ্ট করে আবার বলুন।");
          else if (e.error !== "aborted") setError(null);
        };
        r.onend = () => {
          if (recogRef.current) {
            // stopped manually -> nothing; auto restart guard
            recogRef.current = null;
            setListening(false);
            cleanup();
            const secs = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000));
            doneRef.current?.(finalRef.current.trim(), secs);
          }
        };
        recogRef.current = r;
        try {
          r.start();
          setListening(true);
        } catch {
          setError("Speech recognition শুরু করা যায়নি — একবার পেজ রিলোড করুন।");
        }
      }

      tickRef.current = window.setInterval(() => {
        const s = Math.round((Date.now() - startedRef.current) / 1000);
        setSeconds(s);
        if (opts.maxSeconds && s >= opts.maxSeconds) stop();
      }, 250);
    },
    [cleanup, opts.maxSeconds, stop],
  );

  useEffect(
    () => () => {
      try {
        recogRef.current?.abort();
      } catch {
        /* noop */
      }
      cleanup();
    },
    [cleanup],
  );

  return {
    supported,
    listening,
    transcript,
    interim,
    seconds,
    level,
    error,
    start,
    stop,
    reset: () => {
      finalRef.current = "";
      setTranscript("");
      setInterim("");
      setSeconds(0);
    },
    setTranscriptManual: (t: string) => {
      finalRef.current = t;
      setTranscript(t);
    },
  };
}
