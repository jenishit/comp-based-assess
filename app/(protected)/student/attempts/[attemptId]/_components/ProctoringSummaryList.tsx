import { AlertTriangle, Eye, Mic, Monitor, Users, FileText, ShieldCheck, ShieldAlert } from "lucide-react";
import type { AttemptResultProctoringEvent } from "@/types/attempt-types";

const severityColor: Record<string, string> = {
  low: "text-amber-600 bg-amber-50 border-amber-200",
  medium: "text-orange-600 bg-orange-50 border-orange-200",
  high: "text-red-600 bg-red-50 border-red-200",
};

const severityBadge: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-orange-100 text-orange-700",
  low: "bg-amber-100 text-amber-700",
};

const eventIcon: Record<string, typeof AlertTriangle> = {
  face_absent: Eye,
  multiple_faces: Users,
  identity_mismatch: ShieldAlert,
  gaze_away: Eye,
  voice_detected: Mic,
  tab_switch: Monitor,
  window_blur: Monitor,
  paste_event: FileText,
};

interface ProctoringSummaryListProps {
  events: AttemptResultProctoringEvent[];
}

export default function ProctoringSummaryList({ events }: ProctoringSummaryListProps) {
  return (
    <div>
      <h2 className="text-base font-semibold text-espresso mb-3">Proctoring Summary</h2>
      {events.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm">
          <ShieldCheck size={16} className="shrink-0" />
          No proctoring events were flagged during this attempt.
        </div>
      ) : (
        <div className="grid gap-2">
          {events.map((ev) => {
            const Icon = eventIcon[ev.type] || AlertTriangle;
            return (
              <div key={ev.type} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${severityColor[ev.severity] || "bg-gray-50 border-gray-200 text-gray-600"}`}>
                <Icon size={16} className="shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{ev.type.replace(/_/g, " ")}</p>
                  <p className="text-xs opacity-70">Occurred {ev.count} time{ev.count !== 1 ? "s" : ""}</p>
                </div>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${severityBadge[ev.severity] || "bg-amber-100 text-amber-700"}`}>
                  {ev.severity}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
