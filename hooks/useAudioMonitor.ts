"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ProctoringEvent, ProctoringEventType } from "@/types/proctoring-types";
import { createEventThrottle } from "@/lib/proctoring/create-event-throttle";
import { rms, variance, voiceBins } from "@/lib/proctoring/audio-metrics";

export interface AudioMonitorState {
  voiceDetected: boolean;
  multipleSpeakers: boolean;
  noiseLevel: number; // 0-100
  error: string | null;
}

interface UseAudioMonitorOptions {
  attemptId: string;
  enabled?: boolean;
  /** Sink for every audio event this hook produces — wire this to the
   * shared event batcher (see useProctoringEventBatcher) rather than posting
   * per-event. */
  onEvent: (event: ProctoringEvent) => void;
  /** RMS amplitude threshold (0-255) for voice detection. Default 22. */
  voiceThreshold?: number;
  /** Spectral variance threshold for multiple-speaker heuristic. Default 500. */
  multiSpeakerThreshold?: number;
}

const INITIAL: AudioMonitorState = {
  voiceDetected: false,
  multipleSpeakers: false,
  noiseLevel: 0,
  error: null,
};

export function useAudioMonitor(options: UseAudioMonitorOptions): AudioMonitorState {
  const {
    enabled = true,
    onEvent,
    voiceThreshold = 22,
    multiSpeakerThreshold = 500,
  } = options;

  const [state, setState] = useState<AudioMonitorState>(INITIAL);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number>(0);
  const canFireRef = useRef(createEventThrottle<ProctoringEventType>());
  const voiceSinceRef = useRef<number | null>(null);
  const multiSinceRef = useRef<number | null>(null);
  // Holds the latest `analyse` so the rAF loop below can call it recursively
  // without referencing the `useCallback`-bound identifier from within its own body.
  const analyseRef = useRef<() => void>(() => {});

  const fireEvent = useCallback(
    (type: ProctoringEventType, minGapMs: number, meta?: Record<string, number>): void => {
      if (!canFireRef.current(type, minGapMs)) return;

      const event: ProctoringEvent = { type, timestamp: Date.now(), ...(meta ? { metadata: meta } : {}) };
      onEvent(event);
    },
    [onEvent],
  );

  const analyse = useCallback((): void => {
    const analyser = analyserRef.current;
    const data = dataArrayRef.current;

    if (!analyser || !data) {
      rafRef.current = requestAnimationFrame(() => analyseRef.current());
      return;
    }

    analyser.getByteFrequencyData(data as unknown as Uint8Array<ArrayBuffer>);

    const bins = voiceBins(data);
    const amplitude = rms(bins);
    const spectralVar = variance(bins);
    const noiseLevel = Math.min(100, Math.round((amplitude / 255) * 100));
    const voiceNow = amplitude > voiceThreshold;
    const multiNow = voiceNow && spectralVar > multiSpeakerThreshold;

    const now = Date.now();

    // voice_detected fires only after 2s of sustained voice, then every 5s
    if (voiceNow) {
      if (!voiceSinceRef.current) voiceSinceRef.current = now;
      if (now - voiceSinceRef.current >= 2_000) {
        fireEvent("voice_detected", 5_000, { noiseLevel, amplitude: Math.round(amplitude) });
      }
    } else {
      voiceSinceRef.current = null;
    }

    // Same sustain requirement as voice_detected — one noisy frame (a door
    // slam, a burst of AC hum) has high variance too; only a second voice
    // actually overlapping the student's for a beat should count.
    if (multiNow) {
      if (!multiSinceRef.current) multiSinceRef.current = now;
      if (now - multiSinceRef.current >= 1_500) {
        fireEvent("multiple_speakers", 8_000, { variance: Math.round(spectralVar), noiseLevel });
      }
    } else {
      multiSinceRef.current = null;
    }

    setState({ voiceDetected: voiceNow, multipleSpeakers: multiNow, noiseLevel, error: null });

    rafRef.current = requestAnimationFrame(() => analyseRef.current());
  }, [voiceThreshold, multiSpeakerThreshold, fireEvent]);

  useEffect(() => {
    analyseRef.current = analyse;
  }, [analyse]);

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
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const ctx = new AudioContext();
        if (ctx.state === "suspended") await ctx.resume(); // Safari can start suspended

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;

        if (!cancelled) rafRef.current = requestAnimationFrame(analyse);
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Microphone access denied";
        setState((s) => ({ ...s, error: message }));
      }
    };

    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => { /* ignore close errors */ });
      audioCtxRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
    };
  }, [enabled, analyse]);

  return state;
}
