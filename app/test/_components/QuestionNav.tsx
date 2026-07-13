import clsx from "clsx";

interface QuestionNavProps {
  total: number;
  current: number;
  answered: Set<number>;
  flagged: Set<number>;
  onSelect: (index: number) => void;
}

export default function QuestionNav({
  total, current, answered, flagged, onSelect
}: QuestionNavProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-bark uppercase tracking-wide mb-2">
        Questions
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const isAnswered = answered.has(i);
          const isFlagged  = flagged.has(i);
          const isCurrent  = i === current;

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              title={`Question ${i + 1}${isAnswered ? " — answered" : ""}${isFlagged ? " — flagged" : ""}`}
              className={clsx(
                "h-8 w-full rounded-lg text-[12px] font-medium border transition-all",
                isCurrent
                  ? "bg-forest text-white border-forest shadow-sm"
                  : isAnswered && isFlagged
                  ? "bg-amber-400/20 text-amber-600 border-amber-400"
                  : isAnswered
                  ? "bg-forest/15 text-forest-dark border-forest/30"
                  : isFlagged
                  ? "bg-amber-50 text-amber-500 border-amber-200"
                  : "bg-white text-[#5A4A3A] border-sand-border hover:bg-sand-light"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
        {[
          { dot: "bg-forest",         label: "Current"  },
          { dot: "bg-forest/40",      label: "Answered" },
          { dot: "bg-amber-400",      label: "Flagged"  },
          { dot: "bg-sand-border",    label: "Unseen"   },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
            <span className="text-[10px] text-bark">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}