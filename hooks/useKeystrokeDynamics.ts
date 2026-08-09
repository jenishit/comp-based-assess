import { useEffect, useRef } from "react";
import { reportProctoringEvent } from "@/lib/proctoring/report-event";

interface KeystrokeEntry {
  key: string;
  dwell_ms: number;
  flight_ms: number | null;
  timestamp: number;
}

interface UseKeystrokeDynamicsOptions {
  attemptId: string;
  enabled?: boolean;
  /** How often to flush the buffered entries as one batched event. Default 10s. */
  flushIntervalMs?: number;
}

/**
 * Tracks per-key dwell time (keydown -> keyup, same key) and flight time
 * (previous keyup -> this keydown), batching entries into one proctoring
 * event every `flushIntervalMs` instead of one POST per keystroke.
 */
export function useKeystrokeDynamics({
  attemptId,
  enabled = true,
  flushIntervalMs = 10_000,
}: UseKeystrokeDynamicsOptions): void {
  const bufferRef = useRef<KeystrokeEntry[]>([]);
  const downTimestampsRef = useRef<Map<string, number>>(new Map());
  const lastKeyUpRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore auto-repeat while a key is held — only the first keydown counts.
      if (!downTimestampsRef.current.has(e.code)) {
        downTimestampsRef.current.set(e.code, Date.now());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const downAt = downTimestampsRef.current.get(e.code);
      downTimestampsRef.current.delete(e.code);
      if (downAt === undefined) return;

      const now = Date.now();
      const flight = lastKeyUpRef.current !== null ? downAt - lastKeyUpRef.current : null;
      lastKeyUpRef.current = now;

      bufferRef.current.push({
        key: e.key,
        dwell_ms: now - downAt,
        flight_ms: flight,
        timestamp: now,
      });
    };

    const flush = () => {
      if (bufferRef.current.length === 0) return;
      const entries = bufferRef.current;
      bufferRef.current = [];
      reportProctoringEvent(attemptId, {
        type: "keystroke_batch",
        timestamp: Date.now(),
        metadata: { entries },
      }).catch(() => { /* fire-and-forget — never block the exam */ });
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    const intervalId = setInterval(flush, flushIntervalMs);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      clearInterval(intervalId);
      flush();
    };
  }, [attemptId, enabled, flushIntervalMs]);
}
