import type { ProctoringEvent } from "@/types/proctoring-types";

export async function reportProctoringEvent(attemptId: string, event: ProctoringEvent): Promise<void> {
  await fetch(`/api/v1/attempts/${attemptId}/proctoring-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
}
