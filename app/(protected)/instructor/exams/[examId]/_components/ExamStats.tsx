import { FileText, Users, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import type { ExamDetail, QuestionJob } from "@/types/exam-types";

interface ExamStatsProps {
  exam: ExamDetail;
  generationStatus: QuestionJob["status"] | null;
  generationError: string | null;
  retrying: boolean;
  onRetry: () => void;
}

export default function ExamStats({ exam, generationStatus, generationError, retrying, onRetry }: ExamStatsProps) {
  const isGenerating = generationStatus === "pending" || generationStatus === "processing";
  const failed = generationStatus === "failed";
  const partial = generationStatus === "completed" && generationError;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-card rounded-xl border border-sand-border p-4">
        <div className="flex items-center gap-2 text-bark text-xs font-medium uppercase tracking-wide mb-1">
          <Users size={14} /> Students
        </div>
        <p className="text-2xl font-semibold text-espresso">{exam.students?.length || 0}</p>
      </div>

      <div className="bg-card rounded-xl border border-sand-border p-4">
        <div className="flex items-center gap-2 text-bark text-xs font-medium uppercase tracking-wide mb-1">
          <Clock size={14} /> Duration
        </div>
        <p className="text-2xl font-semibold text-espresso">{exam.duration_minutes} min</p>
      </div>

      <div className="bg-card rounded-xl border border-sand-border p-4">
        <div className="flex items-center gap-2 text-bark text-xs font-medium uppercase tracking-wide mb-1">
          <FileText size={14} /> Questions
        </div>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold text-espresso">{exam.question_count || "--"}</p>
          {exam.question_count > 0 && (
            <Link
              href={`/instructor/exams/${exam.id}/questions`}
              className="text-xs font-medium text-forest hover:underline no-underline"
            >
              View
            </Link>
          )}
          {isGenerating ? (
            <Loader2 size={16} className="animate-spin text-forest" />
          ) : failed ? (
            <span className="text-xs text-red-500 font-medium">failed</span>
          ) : partial ? (
            <span className="text-xs text-amber-600 font-medium">partial</span>
          ) : null}
        </div>

        {isGenerating ? (
          <p className="text-xs text-bark mt-1">Generating questions...</p>
        ) : failed ? (
          <div className="mt-2">
            <p className="text-xs text-red-500 mb-1">{generationError || "Generation failed"}</p>
            <button
              onClick={onRetry}
              disabled={retrying}
              className="text-xs font-medium text-forest hover:underline disabled:opacity-50 cursor-pointer bg-transparent border-0 p-0"
            >
              {retrying ? "Retrying..." : "Retry"}
            </button>
          </div>
        ) : partial ? (
          <div className="mt-2">
            <p className="text-xs text-amber-600">{generationError}</p>
            <button
              onClick={onRetry}
              disabled={retrying}
              className="text-xs font-medium text-forest hover:underline disabled:opacity-50 cursor-pointer bg-transparent border-0 p-0"
            >
              {retrying ? "Retrying..." : "Retry to generate remaining questions"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
