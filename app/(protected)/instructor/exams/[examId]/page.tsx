"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { examService } from "@/services/exam-service";
import type { ExamDetail, StudentAttempt } from "@/types/exam";
import { FileText, Copy, Check, Users, Clock, AlertTriangle, Eye, Mic, Monitor } from "lucide-react";

const severityColor: Record<string, string> = {
  low: "text-amber-500 bg-amber-50",
  medium: "text-orange-600 bg-orange-50",
  high: "text-red-600 bg-red-50",
};

const eventIcon: Record<string, typeof AlertTriangle> = {
  face_absent: Eye,
  multiple_faces: Users,
  gaze_away: Eye,
  voice_detected: Mic,
  tab_switch: Monitor,
  window_blur: Monitor,
};

export default function ExamDetailPage() {
  const params = useParams();
  const examId = params?.examId as string;
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!examId) return;
    examService.get(examId).then(setExam).catch(() => {}).finally(() => setLoading(false));
  }, [examId]);

  const copyPin = async (pin: string) => {
    await navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-16">
        <p className="text-bark">Exam not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-espresso tracking-tight">{exam.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              exam.status === "active" ? "bg-green-100 text-green-700" :
              exam.status === "ended" ? "bg-gray-100 text-gray-500" :
              "bg-amber-100 text-amber-700"
            }`}>{exam.status}</span>
          </div>
          <p className="text-bark text-sm mt-1">{exam.subject}</p>
        </div>

        <button
          onClick={() => copyPin(exam.pin)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors cursor-pointer border-0"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied!" : exam.pin}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-sand-border p-4">
          <div className="flex items-center gap-2 text-bark text-xs font-medium uppercase tracking-wide mb-1">
            <Users size={14} /> Students
          </div>
          <p className="text-2xl font-semibold text-espresso">{exam.students?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-sand-border p-4">
          <div className="flex items-center gap-2 text-bark text-xs font-medium uppercase tracking-wide mb-1">
            <Clock size={14} /> Duration
          </div>
          <p className="text-2xl font-semibold text-espresso">{exam.duration_minutes} min</p>
        </div>
        <div className="bg-white rounded-xl border border-sand-border p-4">
          <div className="flex items-center gap-2 text-bark text-xs font-medium uppercase tracking-wide mb-1">
            <FileText size={14} /> Questions
          </div>
          <p className="text-2xl font-semibold text-espresso">{exam.question_count || "--"}</p>
        </div>
      </div>

      {(!exam.students || exam.students.length === 0) ? (
        <div className="text-center py-12 bg-white rounded-xl border border-sand-border">
          <Users size={32} className="mx-auto text-sand mb-3" />
          <h3 className="text-base font-medium text-espresso mb-1">No students yet</h3>
          <p className="text-sm text-bark">Share the PIN with your students to let them join.</p>
        </div>
      ) : (
        <div>
          <h2 className="text-base font-semibold text-espresso mb-3">Students ({exam.students.length})</h2>
          <div className="space-y-3">
            {exam.students.map((s: StudentAttempt) => (
              <div key={s.attempt_id} className="bg-white rounded-xl border border-sand-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-espresso">{s.student_name}</p>
                    <p className="text-xs text-bark">{s.student_email}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      s.status === "graded" ? "bg-green-100 text-green-700" :
                      s.status === "submitted" ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{s.status}</span>
                    {s.score !== undefined && (
                      <span className="font-semibold text-espresso">{s.score}/{s.total_marks}</span>
                    )}
                  </div>
                </div>

                {s.proctoring_events && s.proctoring_events.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {s.proctoring_events.map((ev, i) => {
                      const Icon = eventIcon[ev.type] || AlertTriangle;
                      return (
                        <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${severityColor[ev.severity] || "text-gray-600 bg-gray-50"}`}>
                          <Icon size={10} />
                          {ev.type.replace(/_/g, " ")}: {ev.count}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-2 flex justify-end">
                  <a
                    href={`/dashboard/attempts/${s.attempt_id}`}
                    className="text-xs font-medium text-forest hover:underline"
                  >
                    View details
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
