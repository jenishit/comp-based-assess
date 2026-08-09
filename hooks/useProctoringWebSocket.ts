import { useCallback } from "react";
import type { ProctoringEvent } from "@/types/proctoring-types";
import { useLiveChannel } from "@/hooks/useLiveChannel";

interface UseProctoringWebSocketOptions {
  attemptId: string | null;
  onEvent: (event: ProctoringEvent) => void;
}

/** Subscribes to live proctoring events for one attempt (teacher side).
 * Thin wrapper over useLiveChannel that filters to proctoring events. */
export function useProctoringWebSocket({ attemptId, onEvent }: UseProctoringWebSocketOptions): void {
  const onMessage = useCallback(
    (payload: unknown) => {
      const message = payload as { kind?: string } & ProctoringEvent;
      // The channel also carries evidence_captured / attempt_status frames;
      // this hook's consumers only want the event stream.
      if (message.kind && message.kind !== "proctoring_event") return;
      onEvent(message);
    },
    [onEvent],
  );

  useLiveChannel({
    target: attemptId ? { attemptId } : null,
    onMessage,
  });
}
