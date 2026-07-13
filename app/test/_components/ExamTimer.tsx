"use client"
import { useEffect, useState, useRef } from "react";
import { Clock } from "lucide-react";
import clsx from "clsx";

interface ExamTimerProps {
  durationMinutes: number;
  onExpire: () => void;
}

export default function ExamTimer({ durationMinutes, onExpire }: ExamTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const calledRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(id);
          if (!calledRef.current) { calledRef.current = true; onExpire(); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onExpire]);

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