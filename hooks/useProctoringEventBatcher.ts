"use client";
import { useEffect, useRef, useCallback } from "react";
import type { ProctoringEvent } from "@/types/proctoring-types";
import { createEventBatcher, type ProctoringEventBatcher } from "@/lib/proctoring/event-batcher";

/**
 * Owns one shared 5s-flush event batcher for an attempt. Pass the returned
 * `enqueue` as the `onEvent` sink for the individual monitor hooks so all
 * telemetry collapses into one batched request per flush instead of one
 * request per event.
 */
export function useProctoringEventBatcher(attemptId: string): (event: ProctoringEvent) => void {
  const batcherRef = useRef<ProctoringEventBatcher | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    const batcher = createEventBatcher(attemptId);
    batcherRef.current = batcher;
    return () => {
      batcher.destroy();
      batcherRef.current = null;
    };
  }, [attemptId]);

  return useCallback((event: ProctoringEvent) => {
    batcherRef.current?.enqueue(event);
  }, []);
}
