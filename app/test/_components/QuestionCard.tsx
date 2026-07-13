"use client"
import { Flag, FlagOff } from "lucide-react";
import clsx from "clsx";
import type { Question, Answer } from "@/types/exam";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  answer: Answer | undefined;
  flagged: boolean;
  onAnswer: (value: string) => void;
  onToggleFlag: () => void;
}

export default function QuestionCard({
  question, index, total, answer, flagged, onAnswer, onToggleFlag
}: QuestionCardProps) {
  return (
    <div className="flex flex-col h-full">

      {/* Question header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <p className="text-[11px] font-semibold text-bark uppercase tracking-wide mb-1">
            Question {index + 1} of {total}
            <span className="ml-2 text-sand normal-case font-normal">
              — {question.marks} {question.marks === 1 ? "mark" : "marks"}
            </span>
          </p>
          {question.bloomLevel && (
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full
                             bg-forest/10 text-forest font-medium capitalize">
              {question.bloomLevel}
            </span>
          )}
        </div>
        <button
          onClick={onToggleFlag}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium",
            "border transition-colors",
            flagged
              ? "bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100"
              : "bg-white text-bark border-sand-border hover:bg-sand-light"
          )}
        >
          {flagged ? <FlagOff size={13} /> : <Flag size={13} />}
          {flagged ? "Unflag" : "Flag"}
        </button>
      </div>

      {/* Question text */}
      <div className="bg-sand-light rounded-xl p-5 mb-6 border border-sand-border">
        <p className="text-[15px] text-[#1A100A] leading-[1.7] m-0">{question.text}</p>
      </div>

      {/* MCQ options */}
      {question.type === "mcq" && question.options && (
        <div className="flex flex-col gap-2.5 flex-1">
          {question.options.map((opt, i) => {
            const letter   = ["A", "B", "C", "D", "E"][i];
            const selected = answer?.value === String(i);
            return (
              <button
                key={i}
                onClick={() => onAnswer(String(i))}
                className={clsx(
                  "flex items-center gap-3.5 px-5 py-3.5 rounded-xl border-[1.5px]",
                  "text-left w-full transition-all text-[14px]",
                  selected
                    ? "border-forest bg-forest/10 text-forest-dark"
                    : "border-sand-border bg-white text-[#2A1A0E] hover:bg-sand-light"
                )}
              >
                <div className={clsx(
                  "w-7 h-7 rounded-full shrink-0 flex items-center justify-center",
                  "text-[12px] font-semibold border-[1.5px] transition-colors",
                  selected
                    ? "bg-forest text-white border-forest"
                    : "bg-sand-light text-bark border-sand-border"
                )}>
                  {letter}
                </div>
                <span className={clsx("font-medium", selected && "font-semibold")}>{opt}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Short answer */}
      {question.type === "short_answer" && (
        <div className="flex-1 flex flex-col">
          <textarea
            value={answer?.value ?? ""}
            onChange={e => onAnswer(e.target.value)}
            placeholder="Type your answer here…"
            className="flex-1 w-full px-5 py-4 rounded-xl border-[1.5px] border-sand-border
                       bg-white text-[14px] text-[#1A100A] leading-[1.7] outline-none resize-none
                       focus:border-forest transition-colors placeholder:text-sand min-h-45"
          />
          <p className="text-[11px] text-bark text-right mt-1.5">
            {(answer?.value ?? "").length} characters
          </p>
        </div>
      )}
    </div>
  );
}