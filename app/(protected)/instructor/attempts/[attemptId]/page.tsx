"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { attemptService } from "@/services/exam-service";
import { Clock, Check, AlertTriangle, Eye, Mic, Monitor, Users, FileText } from "lucide-react";

interface AttemptDetail {
  attempt: {
    attempt_id: string;
    exam_title: string;
    exam_subject: string;
    started_at: string;
    submitted_at?: string;
    score?: number;
    total_marks: number;
    status: string;
  };
  answers: Array<{
    question_id: string;
    question_text: string;
    question_type: string;
    value: string;
    marks: number;
    time_spent_seconds: number;
    flagged: boolean;
    options?: string[];
    correctIndex?: number;
    correctAnswer?: string;
  }>;
  proctoring_events: Array<{
    type: string;
    count: number;
    severity: string;
    timestamps: number[];
  }>;
}

const severityColor: Record<string, string> = {
  low: "text-amber-600 bg-amber-50 border-amber-200",
  medium: "text-orange-600 bg-orange-50 border-orange-200",
  high: "text-red-600 bg-red-50 border-red-200",
};

const eventIcon: Record<string, typeof AlertTriangle> = {
  face_absent: Eye,
  multiple_faces: Users,
  gaze_away: Eye,
  voice_detected: Mic,
  tab_switch: Monitor,
  window_blur: Monitor,
  paste_event: FileText,
};

export default function AttemptDetailPage() {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const [data, setData] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) return;
    attemptService.get(attemptId).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [attemptId]);

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

  const { attempt, answers, proctoring_events } = data;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-espresso tracking-tight">{attempt.exam_title}</h1>
        <p className="text-bark text-sm mt-1">{attempt.exam_subject}</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-sand-border p-3">
          <p className="text-[10px] font-medium text-bark uppercase tracking-wide">Status</p>
          <p className="text-sm font-semibold text-espresso mt-1 capitalize">{attempt.status.replace("_", " ")}</p>
        </div>
        <div className="bg-white rounded-xl border border-sand-border p-3">
          <p className="text-[10px] font-medium text-bark uppercase tracking-wide">Score</p>
          <p className="text-sm font-semibold text-espresso mt-1">{attempt.score !== undefined ? `${attempt.score}/${attempt.total_marks}` : "--"}</p>
        </div>
        <div className="bg-white rounded-xl border border-sand-border p-3">
          <p className="text-[10px] font-medium text-bark uppercase tracking-wide">Started</p>
          <p className="text-sm font-semibold text-espresso mt-1">{new Date(attempt.started_at).toLocaleDateString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-sand-border p-3">
          <p className="text-[10px] font-medium text-bark uppercase tracking-wide">Submitted</p>
          <p className="text-sm font-semibold text-espresso mt-1">{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : "--"}</p>
        </div>
      </div>

      {answers.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-espresso mb-3">Answers ({answers.length})</h2>
          <div className="space-y-3">
            {answers.map((a, i) => (
              <div key={a.question_id} className="bg-white rounded-xl border border-sand-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-bark font-medium">Question {i + 1}</p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-1 text-bark"><Clock size={10} />{a.time_spent_seconds}s</span>
                    <span className="text-bark">| {a.marks} marks</span>
                    {a.flagged && <span className="text-amber-500 font-medium">Flagged</span>}
                  </div>
                </div>
                <p className="text-sm text-espresso mb-2">{a.question_text}</p>

                {a.question_type === "mcq" && a.options && (
                  <div className="space-y-1.5">
                    {a.options.map((opt, oi) => {
                      const selected = a.value === String(oi);
                      const correct = a.correctIndex !== undefined && oi === a.correctIndex;
                      return (
                        <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                          selected && correct ? "bg-green-50 border-green-300 text-green-800" :
                          selected && !correct ? "bg-red-50 border-red-200 text-red-700" :
                          correct ? "bg-green-50 border-green-200 text-green-700" :
                          "bg-cream border-sand-border text-espresso"
                        }`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                            selected || correct ? "bg-white" : "bg-white"
                          }`}>
                            {["A", "B", "C", "D", "E"][oi]}
                          </div>
                          <span>{opt}</span>
                          {selected && <Check size={12} className="ml-auto shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {a.question_type === "short_answer" && (
                  <div className="p-3 rounded-lg bg-cream border border-sand-border">
                    <p className="text-sm text-espresso whitespace-pre-wrap">{a.value || <span className="text-sand italic">No answer given</span>}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {proctoring_events.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-espresso mb-3">Proctoring Events</h2>
          <div className="grid gap-2">
            {proctoring_events.map((ev, i) => {
              const Icon = eventIcon[ev.type] || AlertTriangle;
              return (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${severityColor[ev.severity] || "bg-gray-50 border-gray-200 text-gray-600"}`}>
                  <Icon size={16} className="shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{ev.type.replace(/_/g, " ")}</p>
                    <p className="text-xs opacity-70">Occurred {ev.count} time{ev.count !== 1 ? "s" : ""}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    ev.severity === "high" ? "bg-red-100 text-red-700" :
                    ev.severity === "medium" ? "bg-orange-100 text-orange-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{ev.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
