"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { questionGenerationStatusGetService } from "@/services/exam-service";
import type { Question } from "@/types/exam-types";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

const bloomColor: Record<string, string> = {
  remember: "text-gray-600 bg-gray-50",
  understand: "text-blue-600 bg-blue-50",
  apply: "text-forest bg-forest/10",
  analyze: "text-amber-600 bg-amber-50",
  evaluate: "text-orange-600 bg-orange-50",
  create: "text-purple-600 bg-purple-50",
};

export default function ExamQuestionsPage() {
  const params = useParams();
  const examId = params?.examId as string;
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;
    let cancelled = false;
    questionGenerationStatusGetService(examId)
      .then((job) => {
        if (cancelled) return;
        setQuestions(job.questions);
        setStatus(job.status);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load questions for this exam.");
      });
    return () => {
      cancelled = true;
    };
  }, [examId]);

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/instructor/exams/${examId}`}
        className="inline-flex items-center gap-1.5 text-sm text-bark hover:text-espresso transition-colors no-underline mb-4"
      >
        <ArrowLeft size={14} /> Back to exam
      </Link>

      <h1 className="text-2xl font-display font-medium text-espresso tracking-tight mb-6">Questions</h1>

      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : questions === null ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-card rounded-xl border border-sand-border animate-pulse" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-sand-border">
          <Loader2 size={28} className={`mx-auto text-sand mb-3 ${status === "processing" || status === "pending" ? "animate-spin" : ""}`} />
          <p className="text-sm text-bark">
            {status === "processing" || status === "pending" ? "Questions are still being generated." : "No questions yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-card rounded-xl border border-sand-border p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-espresso">
                  {i + 1}. {q.text}
                </p>
                <span className="text-xs text-bark shrink-0">{q.marks} mark{q.marks === 1 ? "" : "s"}</span>
              </div>

              {q.bloomLevel && (
                <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-3 ${bloomColor[q.bloomLevel] || "text-gray-600 bg-gray-50"}`}>
                  {q.bloomLevel}
                </span>
              )}

              {q.type === "mcq" && q.options ? (
                <ul className="space-y-1.5 mt-2">
                  {q.options.map((opt, idx) => (
                    <li
                      key={idx}
                      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
                        idx === q.correctIndex
                          ? "border-forest bg-forest/5 text-espresso font-medium"
                          : "border-sand-border text-bark"
                      }`}
                    >
                      {idx === q.correctIndex && <Check size={14} className="text-forest shrink-0" />}
                      {opt}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-bark mt-2">Short answer</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
