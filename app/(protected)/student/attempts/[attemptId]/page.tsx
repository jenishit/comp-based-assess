"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { attemptResultGetService } from "@/services/exam-service";
import type { AttemptResult } from "@/types/attempt-types";
import { Loader2, Check, Clock, GraduationCap } from "lucide-react";
import AnswerResultList from "./_components/AnswerResultList";
import ProctoringSummaryList from "./_components/ProctoringSummaryList";
import BloomRadarChart from "@/components/dashboard/BloomRadarChart";

const statusCopy: Record<AttemptResult["status"], { label: string; icon: typeof Clock; className: string }> = {
  in_progress: { label: "In progress", icon: Clock, className: "text-amber-700 bg-amber-100" },
  submitted: { label: "Submitted — awaiting grading", icon: Check, className: "text-blue-700 bg-blue-100" },
  graded: { label: "Graded", icon: GraduationCap, className: "text-green-700 bg-green-100" },
};

export default function StudentAttemptResultPage() {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    attemptResultGetService(attemptId)
      .then(setResult)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [attemptId]);

  // AI grading runs async after submission — poll every few seconds until it
  // lands so marks/correctness fill in without a manual refresh.
  useEffect(() => {
    if (!attemptId || result?.status !== "submitted") return;
    pollRef.current = setInterval(() => {
      attemptResultGetService(attemptId).then(setResult).catch(() => {});
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [attemptId, result?.status]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-sage" aria-hidden="true" />
      </div>
    );
  }

  if (error || !result) {
    return <div className="text-center py-16 text-bark">Attempt not found.</div>;
  }

  const status = statusCopy[result.status];
  const Icon = status.icon;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-medium text-espresso tracking-tight">{result.exam_title || "Attempt result"}</h1>
        <p className="text-bark text-sm mt-1">{result.exam_subject}</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-xl border border-sand-border p-3 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-medium text-bark uppercase tracking-wide">Status</p>
          <div className={`flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${status.className}`}>
            <Icon size={12} aria-hidden="true" />
            {status.label}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-sand-border p-3">
          <p className="text-[10px] font-medium text-bark uppercase tracking-wide">Score</p>
          <p className="text-sm font-semibold text-espresso mt-1">
            {result.total_score !== null ? `${result.total_score}/${result.total_marks}` : "--"}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-sand-border p-3">
          <p className="text-[10px] font-medium text-bark uppercase tracking-wide">Started</p>
          <p className="text-sm font-semibold text-espresso mt-1">
            {result.started_at ? new Date(result.started_at).toLocaleDateString() : "--"}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-sand-border p-3">
          <p className="text-[10px] font-medium text-bark uppercase tracking-wide">Submitted</p>
          <p className="text-sm font-semibold text-espresso mt-1">
            {result.submitted_at ? new Date(result.submitted_at).toLocaleDateString() : "--"}
          </p>
        </div>
      </div>

      {Object.keys(result.bloom_level_performance).length > 0 && (
        <div className="mb-6 bg-card rounded-xl border border-sand-border p-5">
          <h2 className="text-sm font-semibold text-espresso mb-3">Your Bloom&apos;s level performance</h2>
          <BloomRadarChart data={result.bloom_level_performance} />
        </div>
      )}

      <AnswerResultList answers={result.answers} />
      <ProctoringSummaryList events={result.proctoring_events} />
    </div>
  );
}
