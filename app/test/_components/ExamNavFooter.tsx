import { ChevronLeft, ChevronRight, Send } from "lucide-react";

interface ExamNavFooterProps {
  currentIdx: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export default function ExamNavFooter({ currentIdx, total, onPrev, onNext, onSubmit }: ExamNavFooterProps) {
  const isLast = currentIdx === total - 1;

  return (
    <div className="border-t border-sand-border bg-white px-8 py-4 flex justify-between items-center shrink-0">
      <button
        onClick={onPrev}
        disabled={currentIdx === 0}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                   border border-sand-border bg-white text-[14px] font-medium
                   text-bark hover:bg-sand-light transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronLeft size={16} /> Previous
      </button>

      <span className="text-[13px] text-bark">
        {currentIdx + 1} of {total}
      </span>

      {isLast ? (
        <button
          onClick={onSubmit}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     border-0 bg-forest text-white text-[14px] font-medium
                     hover:bg-forest-dark transition-colors cursor-pointer"
        >
          Submit exam <Send size={14} />
        </button>
      ) : (
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     border-0 bg-forest text-white text-[14px] font-medium
                     hover:bg-forest-dark transition-colors cursor-pointer"
        >
          Next <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
