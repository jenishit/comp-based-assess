import type { ProctoringEvent } from "@/types/proctoring-types";

function endpointFor(attemptId: string): string {
  return `/api/v1/attempts/${attemptId}/proctoring-events`;
}

/**
 * Immediate, single-event delivery. Reserve for critical/low-volume events
 * (violations, termination) where the batcher's 5s delay is unacceptable —
 * everything else should go through the event batcher instead.
 */
export async function reportProctoringEvent(attemptId: string, event: ProctoringEvent): Promise<void> {
  await fetch(endpointFor(attemptId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
}

/** Batched delivery — one request for many events, used by the event batcher. */
export async function reportProctoringEventsBatch(attemptId: string, events: ProctoringEvent[]): Promise<void> {
  await fetch(endpointFor(attemptId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(events),
  });
}
