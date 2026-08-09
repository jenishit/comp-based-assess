import type { ProctoringEvent } from "@/types/proctoring-types";
import { reportProctoringEventsBatch } from "@/lib/proctoring/report-event";

const FLUSH_INTERVAL_MS = 5_000;

function endpointFor(attemptId: string): string {
  return `/api/v1/attempts/${attemptId}/proctoring-events`;
}

export interface ProctoringEventBatcher {
  enqueue(event: ProctoringEvent): void;
  destroy(): void;
}

/**
 * Buffers proctoring events locally and flushes them as a single array POST
 * every FLUSH_INTERVAL_MS — only when something was actually collected,
 * instead of firing one request per event as it happens.
 */
export function createEventBatcher(attemptId: string): ProctoringEventBatcher {
  let buffer: ProctoringEvent[] = [];

  const flush = (): void => {
    if (buffer.length === 0) return;
    const events = buffer;
    buffer = [];
    reportProctoringEventsBatch(attemptId, events).catch(() => { /* fire-and-forget — never block the exam */ });
  };

  const intervalId = setInterval(flush, FLUSH_INTERVAL_MS);

  // setInterval won't fire again once the tab is gone — use sendBeacon so
  // whatever's still buffered at that point has a chance to land.
  const flushOnPageHide = (): void => {
    if (buffer.length === 0) return;
    const events = buffer;
    buffer = [];
    const payload = JSON.stringify(events);
    const sent = navigator.sendBeacon?.(endpointFor(attemptId), new Blob([payload], { type: "application/json" }));
    if (!sent) reportProctoringEventsBatch(attemptId, events).catch(() => { /* best effort */ });
  };
  window.addEventListener("pagehide", flushOnPageHide);

  return {
    enqueue(event) {
      buffer.push(event);
    },
    destroy() {
      clearInterval(intervalId);
      window.removeEventListener("pagehide", flushOnPageHide);
      flush();
    },
  };
}
