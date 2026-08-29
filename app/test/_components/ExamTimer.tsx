"use client"
import { useEffect, useState, useRef } from "react";
import { Clock } from "lucide-react";
import clsx from "clsx";

interface ExamTimerProps {
  durationMinutes: number;
  /** Server-assigned attempt start time (ISO string) — the deadline the
   * backend actually enforces is startedAt + durationMinutes, fixed from
   * attempt creation regardless of how long this component took to mount
   * (loading, permission prompts, the fullscreen gate). Anchoring to this
   * instead of "seconds since mount" keeps the displayed countdown in sync
   * with the server, so it can't show time remaining after the server has
   * already expired the attempt. Falls back to a mount-relative countdown
   * if omitted. */
  startedAt?: string;
  onExpire: () => void;
}

function computeRemaining(totalSeconds: number, startedAt?: string): number {
  if (!startedAt) return totalSeconds;
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return Math.max(0, totalSeconds - elapsed);
}

export default function ExamTimer({ durationMinutes, startedAt, onExpire }: ExamTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const [remaining, setRemaining] = useState(() => computeRemaining(totalSeconds, startedAt));
  const calledRef = useRef(false);

  useEffect(() => {
    // Recompute from wall-clock time each tick (rather than decrementing a
    // local counter) so a throttled/backgrounded tab catches up correctly
    // instead of drifting from the server's actual deadline.
    const id = setInterval(() => {
      const next = computeRemaining(totalSeconds, startedAt);
      setRemaining(next);
      if (next <= 0 && !calledRef.current) {
        calledRef.current = true;
        onExpire();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [onExpire, totalSeconds, startedAt]);

  const pct  = remaining / totalSeconds;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const color =
    pct > 0.4 ? "text-sage bg-sage/15 border-sage/30"
    : pct > 0.15 ? "text-amber-400 bg-amber-400/15 border-amber-400/30"
    : "text-red-400 bg-red-400/15 border-red-400/30 animate-pulse";

  return (
    <div className={clsx(
      "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border",
      "font-mono text-[15px] font-semibold tracking-wide transition-colors",
      color
    )}>
      <Clock size={15} aria-hidden="true" />
      <span aria-live="polite" aria-label={`${mins} minutes ${secs} seconds remaining`}>
        {display}
      </span>
    </div>
  );
}
