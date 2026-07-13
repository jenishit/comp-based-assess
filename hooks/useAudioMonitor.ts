"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ProctoringEvent, ProctoringEventType } from "@/types/exam";

export interface AudioMonitorState {
  voiceDetected:    boolean;
  multipleSpeakers: boolean;
  noiseLevel:       number;   // 0–100
  error:            string | null;
}

interface UseAudioMonitorOptions {
  enabled?:               boolean;
  onEvent?:               (event: ProctoringEvent) => void;
  /** RMS amplitude threshold (0–255) for voice detection. Default 22. */
  voiceThreshold?:        number;
  /** Spectral variance threshold for multiple-speaker heuristic. Default 500. */
  multiSpeakerThreshold?: number;
}

const INITIAL: AudioMonitorState = {
  voiceDetected:    false,
  multipleSpeakers: false,
  noiseLevel:       0,
  error:            null,
};

// ── Helpers ───────────────────────────────────────────────────────────

/** Root-mean-square of a Uint8Array slice. */
function rms(bins: Uint8Array): number {
  if (bins.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < bins.length; i++) sum += bins[i] * bins[i];
  return Math.sqrt(sum / bins.length);
}

/** Sample variance of a Uint8Array slice. */
function variance(bins: Uint8Array): number {
  if (bins.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < bins.length; i++) sum += bins[i];
  const mean = sum / bins.length;
  let sq = 0;
  for (let i = 0; i < bins.length; i++) sq += (bins[i] - mean) ** 2;
  return sq / bins.length;
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useAudioMonitor(options: UseAudioMonitorOptions = {}): AudioMonitorState {
  const {
    enabled              = true,
    onEvent,
    voiceThreshold       = 22,
    multiSpeakerThreshold = 500,
  } = options;

  const [state, setState] = useState<AudioMonitorState>(INITIAL);

  // Infrastructure refs
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef       = useRef<number>(0);

  // Event-throttle timestamps — keyed by event type
  const lastFiredRef = useRef<Partial<Record<ProctoringEventType, number>>>({});

  // Track when voice started (so we only fire after 2 s continuous voice)
  const voiceSinceRef = useRef<number | null>(null);

  // ── fire a proctoring event (throttled) ────────────────────────────
  const fireEvent = useCallback(
    (type: ProctoringEventType, minGapMs: number, meta?: Record<string, number>): void => {
      const now  = Date.now();
      const last = lastFiredRef.current[type] ?? 0;
      if (now - last < minGapMs) return;
      lastFiredRef.current[type] = now;

      const event: ProctoringEvent = {
        type,
        timestamp: now,
        ...(meta ? { metadata: meta } : {}),
      };
      onEvent?.(event);
      fetch("/api/exam/proctor-event", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(event),
      }).catch(() => { /* fire-and-forget */ });
    },
    [onEvent],
  );

  // ── per-frame analysis loop ────────────────────────────────────────
  const analyse = useCallback((): void => {
    const analyser = analyserRef.current;
    const data     = dataArrayRef.current;

    if (!analyser || !data) {
      rafRef.current = requestAnimationFrame(analyse);
      return;
    }

    analyser.getByteFrequencyData(data as unknown as Uint8Array<ArrayBuffer>);

    // Speech range: ~150–3 000 Hz
    // At fftSize=512, sampleRate≈44 100 Hz → bin width ≈ 86 Hz
    // bins 2–35 ≈ 172–3 010 Hz
    const voiceBins   = data.subarray(2, 36);
    const amplitude   = rms(voiceBins);
    const spectralVar = variance(voiceBins);
    const noiseLevel  = Math.min(100, Math.round((amplitude / 255) * 100));
    const voiceNow    = amplitude > voiceThreshold;
    const multiNow    = voiceNow && spectralVar > multiSpeakerThreshold;

    const now = Date.now();

    // voice_detected — only after 2 s of sustained voice, then every 5 s
    if (voiceNow) {
      if (!voiceSinceRef.current) voiceSinceRef.current = now;
      if (now - voiceSinceRef.current >= 2_000) {
        fireEvent("voice_detected", 5_000, { noiseLevel, amplitude: Math.round(amplitude) });
      }
    } else {
      voiceSinceRef.current = null;
    }

    // multiple_speakers — once every 8 s
    if (multiNow) {
      fireEvent("multiple_speakers", 8_000, {
        variance: Math.round(spectralVar),
        noiseLevel,
      });
    }

    setState({
      voiceDetected:    voiceNow,
      multipleSpeakers: multiNow,
      noiseLevel,
      error:            null,
    });

    rafRef.current = requestAnimationFrame(analyse);
  }, [voiceThreshold, multiSpeakerThreshold, fireEvent]);

  // ── setup / teardown ───────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const setup = async (): Promise<void> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        const ctx = new AudioContext();
        // Safari can start in "suspended" state; resume it
        if (ctx.state === "suspended") await ctx.resume();

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        audioCtxRef.current  = ctx;
        analyserRef.current  = analyser;

        if (!cancelled) {
          rafRef.current = requestAnimationFrame(analyse);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Microphone access denied";
        setState(s => ({ ...s, error: message }));
      }
    };

    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close().catch(() => { /* ignore close errors */ });
      audioCtxRef.current  = null;
      analyserRef.current  = null;
      dataArrayRef.current = null;
    };
  }, [enabled, analyse]);

  return state;
}
