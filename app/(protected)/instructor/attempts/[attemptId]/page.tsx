"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { attemptGetService, attemptGazeSamplesGetService, attemptReviewGetService } from "@/services/exam-service";
import GazePlot from "@/components/dashboard/GazePlot";
import { useProctoringWebSocket } from "@/hooks/useProctoringWebSocket";
import type { GazeSample } from "@/types/proctoring-types";
import type { AttemptDetail, AnswerReview } from "@/types/attempt-types";
import AttemptStats from "./_components/AttemptStats";
import AnswerList from "./_components/AnswerList";
import ProctoringEventsList from "./_components/ProctoringEventsList";
import MLReviewPanel from "./_components/MLReviewPanel";
import GradingPanel from "./_components/GradingPanel";

// Mirrors app/schemas/_mappers.py's PROCTORING_SEVERITY — used only for an
// optimistic client-side severity label until the next full refresh.
const CLIENT_SEVERITY: Record<string, string> = {
  multiple_faces: "high", voice_detected: "high", multiple_speakers: "high",
  fullscreen_exit: "high", pointer_lock_exit: "high", session_terminated: "high",
  face_absent: "medium", paste_event: "medium", tab_switch: "medium", window_blur: "medium",
};
const GAZE_EVENT_TYPES = new Set(["gaze_away", "gaze_returned", "gaze_sample"]);

export default function AttemptDetailPage() {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const [data, setData] = useState<AttemptDetail | null>(null);
  const [gazeSamples, setGazeSamples] = useState<GazeSample[]>([]);
  const [reviews, setReviews] = useState<AnswerReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) return;
    attemptGetService(attemptId).then(setData).catch(() => {}).finally(() => setLoading(false));
    attemptGazeSamplesGetService(attemptId).then(setGazeSamples).catch(() => {});
    // Only meaningful once the attempt is graded — a 400 (not in progress
    // guard aside) or empty list on an in-progress attempt is expected, so
    // failures here are silently ignored rather than surfaced as an error.
    attemptReviewGetService(attemptId).then(setReviews).catch(() => {});
  }, [attemptId]);

  useProctoringWebSocket({
    attemptId: attemptId || null,
    onEvent: (event) => {
      if (GAZE_EVENT_TYPES.has(event.type)) {
        setGazeSamples((prev) => [
          ...prev,
          {
            timestamp: event.timestamp,
            yaw: event.metadata?.yaw as number | undefined,
            pitch: event.metadata?.pitch as number | undefined,
            direction: event.metadata?.direction as string | undefined,
            duration: event.duration,
          },
        ]);
      }

      setData((prev) => {
        if (!prev) return prev;
        const existing = prev.proctoring_events.find((e) => e.type === event.type);
        const proctoring_events = existing
          ? prev.proctoring_events.map((e) =>
              e.type === event.type
                ? { ...e, count: e.count + 1, timestamps: [...e.timestamps, event.timestamp] }
                : e,
            )
          : [
              ...prev.proctoring_events,
              {
                type: event.type,
                count: 1,
                severity: (CLIENT_SEVERITY[event.type] ?? "low") as "low" | "medium" | "high",
                timestamps: [event.timestamp],
              },
            ];
        return { ...prev, proctoring_events };
      });
    },
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-8" />
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse mb-3" />)}
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-16 text-bark">Attempt not found.</div>;
  }

  const { attempt, answers, proctoring_events, ml_reviews } = data;

  const handleScoreUpdated = (newTotalScore: number) => {
    setData((prev) => (prev ? { ...prev, attempt: { ...prev.attempt, score: newTotalScore } } : prev));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-medium text-espresso tracking-tight">{attempt.exam_title}</h1>
        <p className="text-bark text-sm mt-1">{attempt.exam_subject}</p>
      </div>

      <AttemptStats attempt={attempt} />

      <div className="mb-6">
        <GazePlot samples={gazeSamples} />
      </div>

      <AnswerList answers={answers} />
      <GradingPanel attemptId={attemptId} reviews={reviews} onScoreUpdated={handleScoreUpdated} />
      <MLReviewPanel reviews={ml_reviews} />
      <ProctoringEventsList events={proctoring_events} />
    </div>
  );
}
