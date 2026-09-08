"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Mic, RotateCcw, Volume2 } from "lucide-react";
import { rms, variance, voiceBins } from "@/lib/proctoring/audio-metrics";

export interface CalibratedAudioThresholds {
  voiceThreshold: number;
  multiSpeakerThreshold: number;
}

interface DeviceCheckStepProps {
  /** Called once with calibrated thresholds, or null if the student skipped
   * calibration / permission was denied — the caller falls back to
   * useAudioMonitor's defaults in that case. */
  onComplete: (thresholds: CalibratedAudioThresholds | null) => void;
}

type Phase = "requesting" | "silence" | "speech" | "error";

const SILENCE_MS = 3_000;
const SPEECH_MS = 3_000;

// Floors so one odd calibration run (talked during the silence phase, mic
// picked up near-nothing) can't leave the real monitor with a threshold so
// low it free-fires on room tone alone.
const MIN_VOICE_THRESHOLD = 10;
const MIN_MULTI_SPEAKER_THRESHOLD = 300;

// Ceilings exist only to catch a genuinely broken calibration run (e.g. the
// mic captured silence/noise at the hardware's max), NOT to cap a loud but
// legitimate room — a static ceiling below the room's own measured noise
// would clamp the threshold back down *under* the ambient floor it was
// just measured against, which defeats calibration in exactly the noisy
// room it exists for. So the ceiling always trails whatever was actually
// measured, never a fixed number.
function withFloorAndTrailingCeiling(raw: number, floor: number, measured: number, ceilingMargin: number): number {
  const ceiling = Math.max(floor * 5, measured + ceilingMargin);
  return Math.min(ceiling, Math.max(floor, raw));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// 75th percentile rather than max — one loud spike (a cough, a chair creak)
// shouldn't set the bar for "this is what speaking sounds like".
function p75(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.floor(sorted.length * 0.75)];
}

interface Sample {
  amp: number;
  varr: number;
}

/**
 * Runs once, ahead of the fullscreen gate: requests camera+mic together (so
 * the mic prompt never surfaces later, mid-fullscreen — see
 * useExamSecurity's fullscreen_exit handling) and measures this room's
 * actual ambient noise against this student's actual speaking voice, so
 * useAudioMonitor's voice/multi-speaker thresholds are relative to this
 * room instead of a fixed guess that flags background noise as a second
 * speaker.
 */
export default function DeviceCheckStep({ onComplete }: DeviceCheckStepProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>("requesting");
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [attempt, setAttempt] = useState(0);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null;
    audioCtxRef.current = null;
  }, []);

  const skip = useCallback(() => {
    cleanup();
    onComplete(null);
  }, [cleanup, onComplete]);

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      setPhase("requesting");
      setError(null);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Camera/microphone access denied");
        setPhase("error");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      const ctx = new AudioContext();
      if (ctx.state === "suspended") await ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const collect = (bucket: Sample[]): void => {
        analyser.getByteFrequencyData(data as unknown as Uint8Array<ArrayBuffer>);
        const bins = voiceBins(data);
        bucket.push({ amp: rms(bins), varr: variance(bins) });
      };

      const runPhase = (ms: number, bucket: Sample[]): Promise<void> =>
        new Promise((resolve) => {
          const start = performance.now();
          let lastSecond = -1;
          const tick = (): void => {
            if (cancelled) {
              resolve();
              return;
            }
            collect(bucket);
            const elapsed = performance.now() - start;
            const remaining = Math.max(0, Math.ceil((ms - elapsed) / 1000));
            if (remaining !== lastSecond) {
              lastSecond = remaining;
              setSecondsLeft(remaining);
            }
            if (elapsed >= ms) {
              resolve();
              return;
            }
            rafRef.current = requestAnimationFrame(tick);
          };
          tick();
        });

      const silenceSamples: Sample[] = [];
      const speechSamples: Sample[] = [];

      setPhase("silence");
      await runPhase(SILENCE_MS, silenceSamples);
      if (cancelled) return;

      setPhase("speech");
      await runPhase(SPEECH_MS, speechSamples);
      if (cancelled) return;

      const ambientAmp = average(silenceSamples.map((s) => s.amp));
      const ambientVar = average(silenceSamples.map((s) => s.varr));
      const speechAmp = p75(speechSamples.map((s) => s.amp).sort((a, b) => a - b));
      const speechVar = p75(speechSamples.map((s) => s.varr).sort((a, b) => a - b));

      const voiceThreshold = withFloorAndTrailingCeiling(
        ambientAmp + Math.max(6, (speechAmp - ambientAmp) * 0.35),
        MIN_VOICE_THRESHOLD,
        ambientAmp,
        40,
      );
      // Above both this room's ambient noise AND this student's own single
      // voice — background noise or one person talking should never cross
      // it; only genuinely higher variance (an overlapping second voice)
      // should.
      const multiSpeakerThreshold = withFloorAndTrailingCeiling(
        Math.max(ambientVar, speechVar) + 150,
        MIN_MULTI_SPEAKER_THRESHOLD,
        Math.max(ambientVar, speechVar),
        400,
      );

      cleanup();
      if (cancelled) return;
      onComplete({ voiceThreshold, multiSpeakerThreshold });
    };

    run();
    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-6">
      <div className="text-center max-w-md w-full">
        <div className="relative rounded-xl overflow-hidden bg-card/10 border border-white/10 aspect-video mb-5">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {phase === "requesting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Camera size={22} className="text-sand" aria-hidden="true" />
              <p className="text-[11px] text-sand">Requesting camera &amp; microphone…</p>
            </div>
          )}
          {(phase === "silence" || phase === "speech") && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 flex items-center justify-center gap-2">
              {phase === "silence" ? (
                <Mic size={14} className="text-sage" aria-hidden="true" />
              ) : (
                <Volume2 size={14} className="text-sage" aria-hidden="true" />
              )}
              <p className="text-[11px] font-medium text-white">{secondsLeft}s</p>
            </div>
          )}
        </div>

        {phase === "error" ? (
          <>
            <h2 className="text-xl font-medium text-white mb-2">Camera &amp; microphone needed</h2>
            <p className="text-[#9C96A8] text-[14px] leading-relaxed mb-4">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setAttempt((n) => n + 1)}
                className="px-5 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer border-0 flex items-center gap-2"
              >
                <RotateCcw size={14} aria-hidden="true" /> Retry
              </button>
              <button
                onClick={skip}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors cursor-pointer border-0"
              >
                Continue without calibration
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-medium text-white mb-2">
              {phase === "requesting" && "Setting up your camera & mic"}
              {phase === "silence" && "Stay quiet for a moment"}
              {phase === "speech" && "Now say a few words out loud"}
            </h2>
            <p className="text-[#9C96A8] text-[14px] leading-relaxed">
              {phase === "requesting" && "Allow access when your browser asks."}
              {phase === "silence" && "We're measuring the background noise in your room."}
              {phase === "speech" && "e.g. “testing, one two three” — this tunes voice detection to your voice, not your room."}
            </p>
            {phase !== "requesting" && (
              <button
                onClick={skip}
                className="mt-4 text-[12px] text-[#726C7E] hover:text-[#9C96A8] transition-colors cursor-pointer bg-transparent border-0 underline"
              >
                Skip calibration
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
