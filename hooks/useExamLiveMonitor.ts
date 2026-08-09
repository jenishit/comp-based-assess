"use client";
import { useCallback, useState } from "react";
import { useLiveChannel } from "@/hooks/useLiveChannel";
import type { ExamLiveMessage, ProctoringEventType } from "@/types/proctoring-types";

export interface LiveAttemptState {
  /** Live count per event type, merged on top of the page-load snapshot. */
  eventCounts: Record<string, number>;
  /** Highest severity seen live, for at-a-glance risk coloring. */
  topSeverity: "low" | "medium" | "high" | null;
  status: "in_progress" | "submitted" | null;
  lastEventAt: number | null;
  /** Newly-joined student not present in the initial snapshot. */
  studentName?: string;
  studentEmail?: string;
}

const SEVERITY_RANK: Record<string, number> = { low: 1, medium: 2, high: 3 };

/**
 * Subscribes an instructor to the whole-exam live channel and maintains a
 * per-attempt live state map. Combined with the page-load snapshot in
 * StudentList, this turns the roster into a real-time dashboard: event
 * counts tick up, new joiners appear, and submissions flip status without
 * a refresh.
 */
export function useExamLiveMonitor(examId: string | null): Record<string, LiveAttemptState> {
  const [live, setLive] = useState<Record<string, LiveAttemptState>>({});

  const onMessage = useCallback((payload: unknown) => {
    const message = payload as ExamLiveMessage;
    if (!message || !("kind" in message)) return;

    setLive((prev) => {
      const attemptId = message.attempt_id;
      const current: LiveAttemptState = prev[attemptId] ?? {
        eventCounts: {},
        topSeverity: null,
        status: null,
        lastEventAt: null,
      };

      if (message.kind === "proctoring_event") {
        const type = message.type as ProctoringEventType;
        const nextTop =
          current.topSeverity === null || SEVERITY_RANK[message.severity] > SEVERITY_RANK[current.topSeverity]
            ? message.severity
            : current.topSeverity;
        return {
          ...prev,
          [attemptId]: {
            ...current,
            eventCounts: { ...current.eventCounts, [type]: (current.eventCounts[type] ?? 0) + 1 },
            topSeverity: nextTop,
            lastEventAt: message.timestamp,
          },
        };
      }

      if (message.kind === "attempt_status") {
        return {
          ...prev,
          [attemptId]: {
            ...current,
            status: message.status,
            studentName: message.student_name ?? current.studentName,
            studentEmail: message.student_email ?? current.studentEmail,
          },
        };
      }

      return prev;
    });
  }, []);

  useLiveChannel({
    target: examId ? { examId } : null,
    onMessage,
  });

  return live;
}
