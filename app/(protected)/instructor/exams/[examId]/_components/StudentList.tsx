import Link from "next/link";
import { Users, AlertTriangle, Eye, Mic, Monitor, Smartphone, BookOpen, ShieldAlert } from "lucide-react";
import type { StudentAttempt } from "@/types/exam-types";
import type { LiveAttemptState } from "@/hooks/useExamLiveMonitor";

const severityColor: Record<string, string> = {
  low: "text-amber-500 bg-amber-50",
  medium: "text-orange-600 bg-orange-50",
  high: "text-red-600 bg-red-50",
};

const riskDot: Record<string, string> = {
  low: "bg-amber-400",
  medium: "bg-orange-500",
  high: "bg-red-500",
};

const eventIcon: Record<string, typeof AlertTriangle> = {
  face_absent: Eye,
  face_returned: Eye,
  multiple_faces: Users,
  gaze_away: Eye,
  voice_detected: Mic,
  tab_switch: Monitor,
  window_blur: Monitor,
  phone_detected: Smartphone,
  book_detected: BookOpen,
  vm_detected: ShieldAlert,
  multiple_monitors: Monitor,
};

interface StudentListProps {
  students: StudentAttempt[];
  /** Live per-attempt state from the exam WebSocket channel, merged on top of
   * the page-load snapshot. */
  live?: Record<string, LiveAttemptState>;
  /** Whether the live channel is currently connected — drives the header dot. */
  liveConnected?: boolean;
}

export default function StudentList({ students, live = {}, liveConnected = false }: StudentListProps) {
  // Merge snapshot rows with any brand-new joiners that arrived only over the
  // live channel (not present at page load).
  const snapshotIds = new Set(students.map((s) => s.attempt_id));
  const liveOnly = Object.entries(live).filter(
    ([attemptId, s]) => !snapshotIds.has(attemptId) && s.studentName,
  );

  if (students.length === 0 && liveOnly.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-sand-border">
        <Users size={32} className="mx-auto text-sand mb-3" />
        <h3 className="text-base font-medium text-espresso mb-1">No students yet</h3>
        <p className="text-sm text-bark">Share the PIN with your students to let them join.</p>
      </div>
    );
  }

  const totalCount = students.length + liveOnly.length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-semibold text-espresso">Students ({totalCount})</h2>
        <span className="flex items-center gap-1.5 text-[11px] text-bark">
          <span className={`w-2 h-2 rounded-full ${liveConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
          {liveConnected ? "Live" : "Offline"}
        </span>
      </div>
      <div className="space-y-3">
        {students.map((s) => {
          const liveState = live[s.attempt_id];
          // Merge snapshot counts with live increments.
          const merged = new Map<string, { count: number; severity: string }>();
          for (const ev of s.proctoring_events) merged.set(ev.type, { count: ev.count, severity: ev.severity });
          if (liveState) {
            for (const [type, count] of Object.entries(liveState.eventCounts)) {
              const existing = merged.get(type);
              merged.set(type, {
                count: (existing?.count ?? 0) + count,
                severity: existing?.severity ?? "low",
              });
            }
          }
          const status = liveState?.status === "submitted" && s.status === "in_progress" ? "submitted" : s.status;

          return (
            <div key={s.attempt_id} className="bg-card rounded-xl border border-sand-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {liveState?.topSeverity && (
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${riskDot[liveState.topSeverity]}`}
                      title={`Highest live risk: ${liveState.topSeverity}`}
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-espresso">{s.student_name}</p>
                    <p className="text-xs text-bark">{s.student_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    status === "graded" ? "bg-green-100 text-green-700" :
                    status === "submitted" ? "bg-blue-100 text-blue-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{status}</span>
                  {s.score !== undefined && (
                    <span className="font-semibold text-espresso">{s.score}/{s.total_marks}</span>
                  )}
                </div>
              </div>

              {merged.size > 0 && (
                <div className="flex flex-wrap gap-2">
                  {[...merged.entries()].map(([type, ev], i) => {
                    const Icon = eventIcon[type] || AlertTriangle;
                    return (
                      <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${severityColor[ev.severity] || "text-gray-600 bg-gray-50"}`}>
                        <Icon size={10} />
                        {type.replace(/_/g, " ")}: {ev.count}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-2 flex justify-end">
                <Link
                  href={`/instructor/attempts/${s.attempt_id}`}
                  className="text-xs font-medium text-forest hover:underline"
                >
                  View details
                </Link>
              </div>
            </div>
          );
        })}

        {/* Students who joined after the page loaded — visible immediately
            via the live channel, before the next full refresh. */}
        {liveOnly.map(([attemptId, s]) => (
          <div key={attemptId} className="bg-card rounded-xl border border-forest/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {s.topSeverity && <span className={`w-2.5 h-2.5 rounded-full ${riskDot[s.topSeverity]}`} />}
                <div>
                  <p className="text-sm font-semibold text-espresso">{s.studentName}</p>
                  <p className="text-xs text-bark">{s.studentEmail}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full font-medium text-[11px] bg-amber-100 text-amber-700">
                just joined
              </span>
            </div>
            <div className="mt-2 flex justify-end">
              <Link href={`/instructor/attempts/${attemptId}`} className="text-xs font-medium text-forest hover:underline">
                View details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
