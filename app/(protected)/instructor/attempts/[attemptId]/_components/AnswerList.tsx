import { Clock, Check } from "lucide-react";
import type { AnswerDetail } from "@/types/attempt-types";

interface AnswerListProps {
  answers: AnswerDetail[];
}

export default function AnswerList({ answers }: AnswerListProps) {
  if (answers.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-espresso mb-3">Answers ({answers.length})</h2>
      <div className="space-y-3">
        {answers.map((a, i) => (
          <div key={a.question_id} className="bg-card rounded-xl border border-sand-border p-4">
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
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 bg-card">
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
                <p className="text-sm text-espresso whitespace-pre-wrap">
                  {a.value || <span className="text-sand italic">No answer given</span>}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
