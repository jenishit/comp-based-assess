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

export type ProctoringEventType =
  | "face_absent"
  | "multiple_faces"
  | "gaze_away"
  | "gaze_returned"
  | "voice_detected"
  | "multiple_speakers"
  | "paste_event"
  | "tab_switch"
  | "window_blur"
  | "typing_stopped"
  | "typing_resumed";

export interface ProctoringEvent {
  type: ProctoringEventType;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface ProctoringState {
  cameraReady: boolean;
  faceCount: number;
  gazeAway: boolean;
  gazeDirection: "center" | "left" | "right" | "up" | "down";
  voiceDetected: boolean;
  multipleSpeakers: boolean;
  pasteCount: number;
  tabSwitches: number;
  windowBlurs: number;
  typingActive: boolean;
  error: string | null;
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

export interface ProctoringEventSummary {
  type: ProctoringEventType;
  count: number;
  severity: "low" | "medium" | "high";
}

export interface CreateExamPayload {
  title: string;
  subject: string;
  description?: string;
  duration_minutes: number;
  file_id?: string;
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

export interface AttemptQuestion {
  id: string;
  question_id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  marks: number;
  bloomLevel?: string;
  order: number;
}

export interface SubmitAnswerPayload {
  question_id: string;
  value: string;
  time_spent_seconds: number;
  flagged: boolean;
}

export interface AttemptSummary {
  attempt_id: string;
  exam_title: string;
  exam_subject: string;
  started_at: string;
  submitted_at?: string;
  score?: number;
  total_marks: number;
  status: "in_progress" | "submitted" | "graded";
}

export interface UploadFileResponse {
  success: boolean;
  message: string;
  data: {
    file_id: string;
    filename: string;
    url: string;
  };
}

export interface QuestionJob {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  questions: Question[];
  error?: string;
}
