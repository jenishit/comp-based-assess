export interface TeacherDashboardStats {
  total_exams: number;
  total_students: number;
  active_sessions: number;
  avg_duration_minutes: number | null;
}

export interface StudentDashboardStats {
  exams_taken: number;
  avg_score_pct: number | null;
  upcoming: number;
  files_uploaded: number;
}
