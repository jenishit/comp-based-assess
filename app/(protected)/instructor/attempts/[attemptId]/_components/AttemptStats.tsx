import type { AttemptSummary } from "@/types/attempt-types";

interface AttemptStatsProps {
  attempt: AttemptSummary;
}

export default function AttemptStats({ attempt }: AttemptStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      <div className="bg-white rounded-xl border border-sand-border p-3">
        <p className="text-[10px] font-medium text-bark uppercase tracking-wide">Status</p>
        <p className="text-sm font-semibold text-espresso mt-1 capitalize">{attempt.status.replace("_", " ")}</p>
      </div>
      <div className="bg-white rounded-xl border border-sand-border p-3">
        <p className="text-[10px] font-medium text-bark uppercase tracking-wide">Score</p>
        <p className="text-sm font-semibold text-espresso mt-1">
          {attempt.score !== undefined ? `${attempt.score}/${attempt.total_marks}` : "--"}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-sand-border p-3">
        <p className="text-[10px] font-medium text-bark uppercase tracking-wide">Started</p>
        <p className="text-sm font-semibold text-espresso mt-1">{new Date(attempt.started_at).toLocaleDateString()}</p>
      </div>
      <div className="bg-white rounded-xl border border-sand-border p-3">
        <p className="text-[10px] font-medium text-bark uppercase tracking-wide">Submitted</p>
        <p className="text-sm font-semibold text-espresso mt-1">
          {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : "--"}
        </p>
      </div>
    </div>
  );
}
