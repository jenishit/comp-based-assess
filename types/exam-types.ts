import type { ProctoringEventSummary } from "@/types/proctoring-types";

export type QuestionType = "mcq" | "short_answer";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctIndex?: number;
  marks: number;
  bloomLevel?: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
}

export interface Answer {
  questionId: string;
  value: string;
  timeSpentSeconds: number;
  flagged: boolean;
}

export interface ExamSession {
  examId: string;
  pin: string;
  title: string;
  subject: string;
  durationMinutes: number;
  questions: Question[];
  studentName: string;
  studentEmail: string;
  requireSeb: boolean;
}

// Recurring-daily availability window state, evaluated server-side (server
// owns "now" and the institution timezone — see exam_availability.py).
export type AvailabilityState = "always_open" | "not_started" | "open" | "closed_today" | "ended";

export interface AvailabilityWindow {
  available_from_date?: string;
  available_until_date?: string;
  daily_open_time?: string;
  daily_close_time?: string;
  availability_state: AvailabilityState;
}

export interface ExamSummary extends AvailabilityWindow {
  id: string;
  title: string;
  subject: string;
  pin: string;
  studentsJoined: number;
  createdAt: string;
  durationMinutes: number;
  status: "draft" | "active" | "ended";
  avgScore?: number;
}

export interface ExamDetail extends AvailabilityWindow {
  id: string;
  title: string;
  subject: string;
  subject_id?: string;
  group_id?: string;
  term?: string;
  description?: string;
  pin: string;
  file_id?: string;
  duration_minutes: number;
  total_marks: number;
  status: "draft" | "active" | "ended";
  created_at: string;
  question_count: number;
  students: StudentAttempt[];
  require_seb?: boolean;
}

export interface StudentAttempt {
  attempt_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  started_at: string;
  submitted_at?: string;
  score?: number;
  total_marks: number;
  status: "in_progress" | "submitted" | "graded";
  proctoring_events: ProctoringEventSummary[];
}

export interface CreateExamPayload {
  title: string;
  subject?: string;
  description?: string;
  timer_minutes: number;
  file_id?: string;
  mcq_count: string;
  subject_id?: string;
  group_id?: string;
  term?: string;
  available_from_date?: string;
  available_until_date?: string;
  daily_open_time?: string;
  daily_close_time?: string;
  require_seb?: boolean;
}

// Shape of the 403 error body for a join blocked by the availability window
// (see availability_error_detail in exam_availability.py). Other join
// failures (bad PIN, not on roster) still come back as a plain string detail.
export interface AvailabilityErrorDetail {
  code: Exclude<AvailabilityState, "always_open" | "open">;
  message: string;
}

export interface RosterEntry {
  id: string;
  name: string;
  email: string;
}

export interface RosterUploadResponse {
  added: number;
  total: number;
  entries: RosterEntry[];
}

export interface JoinExamPayload {
  pin: string;
  name: string;
  email: string;
}

export interface JoinExamResponse {
  success: boolean;
  message: string;
  data: {
    attempt_id: string;
    exam_id: string;
    title: string;
    subject: string;
    duration_minutes: number;
    already_enrolled: boolean;
  };
}

export interface CreatePracticeExamPayload {
  title: string;
  timer_minutes: number;
  file_id?: string;
}

export interface PracticeAttempt {
  attempt_id: string;
  exam_id: string;
  pin: string;
}

export interface QuestionJob {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  questions: Question[];
  error?: string;
}
