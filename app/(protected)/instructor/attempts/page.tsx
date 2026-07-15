"use client";

import { useEffect, useState } from "react";
import { attemptService } from "@/services/exam-service";
import type { AttemptSummary } from "@/types/exam";
import { ClipboardList, Clock, Check, X as XIcon } from "lucide-react";
import Link from "next/link";

const statusBadge: Record<string, string> = {
  in_progress: "bg-amber-100 text-amber-700",
  submitted: "bg-blue-100 text-blue-700",
  graded: "bg-green-100 text-green-700",
};

export default function AttemptsListPage() {
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attemptService.list().then(setAttempts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-espresso tracking-tight">My Attempts</h1>
        <p className="text-bark text-sm mt-1">View your past exam attempts and results.</p>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-sand-border">
          <ClipboardList size={40} className="mx-auto text-sand mb-3" />
          <h3 className="text-base font-medium text-espresso mb-1">No attempts yet</h3>
          <p className="text-sm text-bark">Join an exam to start your first attempt.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => (
            <Link
              key={a.attempt_id}
              href={`/dashboard/attempts/${a.attempt_id}`}
              className="block bg-white rounded-xl border border-sand-border p-4 hover:border-sage transition-colors no-underline"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-espresso truncate">{a.exam_title}</h3>
                  <p className="text-xs text-bark mt-0.5">{a.exam_subject}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge[a.status] || "bg-gray-100 text-gray-500"}`}>
                    {a.status.replace("_", " ")}
                  </span>
                  {a.score !== undefined && (
                    <span className="text-sm font-semibold text-espresso">{a.score}/{a.total_marks}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-bark">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  Started: {new Date(a.started_at).toLocaleDateString()}
                </span>
                {a.submitted_at && (
                  <span className="flex items-center gap-1">
                    <Check size={11} />
                    Submitted: {new Date(a.submitted_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
