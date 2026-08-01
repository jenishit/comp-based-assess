import type { QuestionType } from "@/types/exam-types";
import type { ProctoringEventDetail } from "@/types/proctoring-types";

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

export interface AnswerDetail {
  question_id: string;
  question_text: string;
  question_type: string;
  value: string;
  marks: number;
  time_spent_seconds: number;
  flagged: boolean;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
}

export interface AttemptDetail {
  attempt: AttemptSummary;
  answers: AnswerDetail[];
  proctoring_events: ProctoringEventDetail[];
}
