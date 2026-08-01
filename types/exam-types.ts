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
}

export interface ExamSummary {
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

export interface ExamDetail {
  id: string;
  title: string;
  subject: string;
  description?: string;
  pin: string;
  file_id?: string;
  duration_minutes: number;
  total_marks: number;
  status: "draft" | "active" | "ended";
  created_at: string;
  question_count: number;
  students: StudentAttempt[];
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
  };
}

export interface QuestionJob {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  questions: Question[];
  error?: string;
}
