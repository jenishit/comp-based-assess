import { ScanFace, Activity, Scale } from "lucide-react";
import type { MLReview } from "@/types/attempt-types";

const kindMeta: Record<MLReview["kind"], { label: string; icon: typeof ScanFace }> = {
  face: { label: "Face verification", icon: ScanFace },
  anomaly: { label: "Anomaly detection", icon: Activity },
  fairness: { label: "Fairness review", icon: Scale },
};

function formatValue(value: unknown): string {
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(3);
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (value === null || value === undefined) return "—";
  return String(value);
}

interface MLReviewPanelProps {
  reviews: MLReview[];
}

export default function MLReviewPanel({ reviews }: MLReviewPanelProps) {
  if (reviews.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-espresso mb-3">ML Review</h2>
      <p className="text-xs text-bark mb-3">
        Advisory only — these are unvalidated automated signals for you to weigh, not a pass/fail verdict.
      </p>
      <div className="grid gap-2">
        {reviews.map((review, i) => {
          const meta = kindMeta[review.kind] ?? { label: review.kind, icon: Activity };
          const Icon = meta.icon;
          const entries = Object.entries(review.result).filter(([key]) => key !== "note");
          const note = review.result.note as string | undefined;
          return (
            <div key={i} className="rounded-xl border border-sand-border bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={15} className="text-forest shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium text-espresso">{meta.label}</p>
                <span className="text-[10px] text-bark ml-auto">
                  {new Date(review.created_at).toLocaleString()}
                </span>
              </div>
              {entries.length > 0 && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {entries.map(([key, value]) => (
                    <div key={key} className="contents">
                      <dt className="text-bark capitalize">{key.replace(/_/g, " ")}</dt>
                      <dd className="text-espresso font-medium truncate">{formatValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {note && <p className="text-xs text-bark mt-2 italic">{note}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
