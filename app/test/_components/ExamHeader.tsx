import { Brain, Send } from "lucide-react";
import ExamTimer from "./ExamTimer";
import type { ExamSession } from "@/types/exam-types";

interface ExamHeaderProps {
  exam: ExamSession;
  answeredCount: number;
  onSubmit: () => void;
}

export default function ExamHeader({ exam, answeredCount, onSubmit }: ExamHeaderProps) {
  return (
    <header className="bg-espresso px-6 py-3 flex items-center gap-4 shrink-0 border-b border-[#2E2A3D]">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-[7px] bg-forest flex items-center justify-center">
          <Brain size={15} color="#fff" aria-hidden="true" />
        </div>
        <span className="font-display text-[16px] text-white">PracticeHub</span>
      </div>

      <div className="h-5 w-px bg-[#726C7E]" />

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-white truncate m-0">{exam.title}</p>
        <p className="text-[11px] text-[#726C7E] m-0">{exam.subject}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[12px] text-[#726C7E]">
          {answeredCount} / {exam.questions.length} answered
        </span>
        <ExamTimer durationMinutes={exam.durationMinutes} onExpire={onSubmit} />
        <button
          onClick={onSubmit}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest
                     text-white text-[13px] font-medium border-0 cursor-pointer
                     hover:bg-forest-dark transition-colors"
        >
          <Send size={14} aria-hidden="true" />
          Submit
        </button>
      </div>
    </header>
  );
}
