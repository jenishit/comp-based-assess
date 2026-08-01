import { useEffect, useRef } from "react";
import type { ProctoringEvent } from "@/types/proctoring-types";

// Next.js rewrites don't reliably proxy WebSocket upgrade requests, so this
// connects directly to the backend origin rather than through /api/v1.
function wsUrlFor(attemptId: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:8001/api/v1";
  return `${base.replace(/^http/, "ws")}/ws/attempts/${attemptId}`;
}

interface UseProctoringWebSocketOptions {
  attemptId: string | null;
  onEvent: (event: ProctoringEvent) => void;
}

/** Subscribes to live proctoring events for one attempt over a WebSocket. */
export function useProctoringWebSocket({ attemptId, onEvent }: UseProctoringWebSocketOptions): void {
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!attemptId) return;

    const ws = new WebSocket(wsUrlFor(attemptId));

    ws.onmessage = (msg) => {
      try {
        onEventRef.current(JSON.parse(msg.data) as ProctoringEvent);
      } catch {
        /* ignore malformed frames */
      }
    };

    return () => ws.close();
  }, [attemptId]);
}
