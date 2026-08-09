"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { annualReportGetService } from "@/services/academic-service";
import type { AnnualReport } from "@/types/academic-types";
import { Loader2, TrendingDown, BookOpen } from "lucide-react";

function AnnualReportContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params?.studentId as string;
  const term = searchParams?.get("term") ?? "";

  const [report, setReport] = useState<AnnualReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!studentId || !term) return;
    annualReportGetService(studentId, term)
      .then(setReport)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [studentId, term]);

  if (!term) {
    return <div className="text-center py-16 text-bark">Missing term — open this report from a group.</div>;
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-sage" aria-hidden="true" />
      </div>
    );
  }

  if (error || !report) {
    return <div className="text-center py-16 text-bark">Could not load this report.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-medium text-espresso tracking-tight">Annual report</h1>
        <p className="text-bark text-sm mt-1">Term: {term}</p>
      </div>

      {report.status !== "completed" ? (
        <div className="bg-card rounded-xl border border-sand-border p-6 text-center">
          <BookOpen size={28} className="mx-auto text-sand mb-3" aria-hidden="true" />
          <h3 className="text-base font-medium text-espresso mb-1">Not enough data yet</h3>
          <p className="text-sm text-bark">
            {report.completed_exams ?? 0} of {report.assigned_exams ?? 0} assigned exams completed this term.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-sand-border p-4">
              <p className="text-xs text-bark uppercase tracking-wide mb-1">Overall average</p>
              <p className="text-2xl font-semibold text-espresso">{report.overall_average}%</p>
            </div>
            <div className="bg-card rounded-xl border border-sand-border p-4">
              <p className="text-xs text-bark uppercase tracking-wide mb-1">Exams completed</p>
              <p className="text-2xl font-semibold text-espresso">{report.total_exams}</p>
            </div>
            <div className="bg-card rounded-xl border border-sand-border p-4">
              <p className="text-xs text-bark uppercase tracking-wide mb-1">Subjects</p>
              <p className="text-2xl font-semibold text-espresso">{report.subjects_completed}</p>
            </div>
          </div>

          {report.weakest_area && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-sm">
              <TrendingDown size={15} aria-hidden="true" />
              Weakest Bloom&apos;s level: <span className="font-medium">{report.weakest_area}</span>
            </div>
          )}

          {report.subject_wise_average && Object.keys(report.subject_wise_average).length > 0 && (
            <div className="bg-card rounded-xl border border-sand-border p-5">
              <h2 className="text-sm font-semibold text-espresso mb-3">Subject-wise average</h2>
              <div className="space-y-2">
                {Object.entries(report.subject_wise_average).map(([subject, avg]) => (
                  <div key={subject} className="flex items-center gap-3">
                    <span className="text-xs text-bark w-32 shrink-0 truncate">{subject}</span>
                    <div className="flex-1 h-2 rounded-full bg-sand-light overflow-hidden">
                      <div className="h-full bg-forest" style={{ width: `${Math.min(100, avg)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-espresso w-10 text-right">{avg}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.bloom_level_performance && Object.keys(report.bloom_level_performance).length > 0 && (
            <div className="bg-card rounded-xl border border-sand-border p-5">
              <h2 className="text-sm font-semibold text-espresso mb-3">Bloom&apos;s level performance</h2>
              <div className="space-y-2">
                {Object.entries(report.bloom_level_performance).map(([level, avg]) => (
                  <div key={level} className="flex items-center gap-3">
                    <span className="text-xs text-bark w-32 shrink-0 truncate capitalize">{level}</span>
                    <div className="flex-1 h-2 rounded-full bg-sand-light overflow-hidden">
                      <div className="h-full bg-sage" style={{ width: `${Math.min(100, avg)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-espresso w-10 text-right">{avg}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.exam_history && report.exam_history.length > 0 && (
            <div className="bg-card rounded-xl border border-sand-border p-5">
              <h2 className="text-sm font-semibold text-espresso mb-3">Exam history</h2>
              <div className="space-y-2">
                {report.exam_history.map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-cream border border-sand-border">
                    <div>
                      <p className="text-sm text-espresso">{row.exam}</p>
                      <p className="text-xs text-bark">{row.subject}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-espresso">{row.score_pct}%</span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          row.status === "Passed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnnualReportPage() {
  return (
    <Suspense fallback={null}>
      <AnnualReportContent />
    </Suspense>
  );
}
