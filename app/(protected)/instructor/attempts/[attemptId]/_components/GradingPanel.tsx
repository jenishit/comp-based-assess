"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, PenLine } from "lucide-react";
import { attemptAnswerReviewPatchService } from "@/services/exam-service";
import type { AnswerReview } from "@/types/attempt-types";

interface GradingPanelProps {
  attemptId: string;
  reviews: AnswerReview[];
  onScoreUpdated: (newTotalScore: number) => void;
}

function AnswerReviewRow({
  attemptId,
  review,
  onScoreUpdated,
}: {
  attemptId: string;
  review: AnswerReview;
  onScoreUpdated: (newTotalScore: number) => void;
}) {
  const [marks, setMarks] = useState(String(review.marks_awarded ?? 0));
  const [isCorrect, setIsCorrect] = useState(review.is_correct ?? false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(review.teacher_reviewed);

  const handleSave = async () => {
    const marksNum = Number(marks);
    if (Number.isNaN(marksNum) || marksNum < 0 || marksNum > review.marks_max) {
      toast.error(`Marks must be between 0 and ${review.marks_max}.`);
      return;
    }
    setSaving(true);
    try {
      const res = await attemptAnswerReviewPatchService(attemptId, review.answer_id, {
        marks_awarded: marksNum,
        is_correct: isCorrect,
      });
      setSaved(true);
      onScoreUpdated(res.new_total_score);
      toast.success("Grade saved.");
    } catch {
      toast.error("Failed to save grade — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-sand-border p-4">
      <div className="flex items-start justify-between mb-2 gap-3">
        <p className="text-sm text-espresso flex-1">{review.question_text}</p>
        <span className="text-[10px] text-bark shrink-0">
          {review.graded_by === "AI" ? "AI-graded" : review.graded_by === "TEACHER" ? "Teacher-graded" : "Ungraded"}
          {saved && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 text-green-700">
              <Check size={10} /> Reviewed
            </span>
          )}
        </span>
      </div>

      <div className="p-3 rounded-lg bg-cream border border-sand-border mb-2">
        <p className="text-[10px] text-bark mb-1">Student answer</p>
        <p className="text-sm text-espresso whitespace-pre-wrap">
          {review.student_answer || <span className="text-sand italic">No answer given</span>}
        </p>
      </div>

      {review.model_answer && (
        <div className="p-3 rounded-lg bg-sand-light border border-sand-border mb-2">
          <p className="text-[10px] text-bark mb-1">Model answer</p>
          <p className="text-sm text-espresso whitespace-pre-wrap">{review.model_answer}</p>
        </div>
      )}

      {review.ai_feedback && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 mb-3">
          <p className="text-[10px] text-blue-700 mb-1">AI feedback</p>
          <p className="text-sm text-blue-900 whitespace-pre-wrap">{review.ai_feedback}</p>
        </div>
      )}

      <div className="flex items-end gap-3 pt-1">
        <div>
          <label className="block text-[10px] font-medium text-bark mb-1">
            Marks (of {review.marks_max})
          </label>
          <input
            type="number"
            min={0}
            max={review.marks_max}
            step="0.5"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            className="w-20 px-2 py-1.5 rounded-lg border border-sand-border bg-cream text-sm text-espresso outline-none focus:border-sage"
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-espresso pb-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isCorrect}
            onChange={(e) => setIsCorrect(e.target.checked)}
            className="cursor-pointer"
          />
          Correct
        </label>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-60 border-0 cursor-pointer"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <PenLine size={12} />}
          Save grade
        </button>
      </div>
    </div>
  );
}

export default function GradingPanel({ attemptId, reviews, onScoreUpdated }: GradingPanelProps) {
  if (reviews.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-espresso mb-3">Grading &amp; Feedback</h2>
      <div className="space-y-3">
        {reviews.map((review) => (
          <AnswerReviewRow
            key={review.answer_id}
            attemptId={attemptId}
            review={review}
            onScoreUpdated={onScoreUpdated}
          />
        ))}
      </div>
    </div>
  );
}
