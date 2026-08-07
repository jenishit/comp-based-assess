import Link from "next/link";
import { Users, AlertTriangle, Eye, Mic, Monitor } from "lucide-react";
import type { StudentAttempt } from "@/types/exam-types";

const severityColor: Record<string, string> = {
  low: "text-amber-500 bg-amber-50",
  medium: "text-orange-600 bg-orange-50",
  high: "text-red-600 bg-red-50",
};

const eventIcon: Record<string, typeof AlertTriangle> = {
  face_absent: Eye,
  multiple_faces: Users,
  gaze_away: Eye,
  voice_detected: Mic,
  tab_switch: Monitor,
  window_blur: Monitor,
};

interface StudentListProps {
  students: StudentAttempt[];
}

export default function StudentList({ students }: StudentListProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-sand-border">
        <Users size={32} className="mx-auto text-sand mb-3" />
        <h3 className="text-base font-medium text-espresso mb-1">No students yet</h3>
        <p className="text-sm text-bark">Share the PIN with your students to let them join.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-espresso mb-3">Students ({students.length})</h2>
      <div className="space-y-3">
        {students.map((s) => (
          <div key={s.attempt_id} className="bg-card rounded-xl border border-sand-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-espresso">{s.student_name}</p>
                <p className="text-xs text-bark">{s.student_email}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  s.status === "graded" ? "bg-green-100 text-green-700" :
                  s.status === "submitted" ? "bg-blue-100 text-blue-700" :
                  "bg-amber-100 text-amber-700"
                }`}>{s.status}</span>
                {s.score !== undefined && (
                  <span className="font-semibold text-espresso">{s.score}/{s.total_marks}</span>
                )}
              </div>
            </div>

            {s.proctoring_events.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {s.proctoring_events.map((ev, i) => {
                  const Icon = eventIcon[ev.type] || AlertTriangle;
                  return (
                    <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${severityColor[ev.severity] || "text-gray-600 bg-gray-50"}`}>
                      <Icon size={10} />
                      {ev.type.replace(/_/g, " ")}: {ev.count}
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
        ))}
      </div>
    </div>
  );
}
