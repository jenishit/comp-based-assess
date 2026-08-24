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

export interface MLReview {
  kind: "face" | "anomaly" | "fairness";
  result: Record<string, unknown>;
  created_at: string;
}

export interface AttemptDetail {
  attempt: AttemptSummary;
  answers: AnswerDetail[];
  proctoring_events: ProctoringEventDetail[];
  ml_reviews: MLReview[];
  bloom_level_performance: Record<string, number>;
}

export interface AttemptResultAnswer {
  question_id: string;
  question_text: string;
  question_type: string;
  value: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  marks_max: number;
  marks_awarded?: number;
  is_correct?: boolean;
  flagged: boolean;
  time_spent_seconds: number;
}

export interface AttemptResultProctoringEvent {
  type: string;
  count: number;
  severity: "low" | "medium" | "high";
}

export interface AttemptResult {
  attempt_id: string;
  status: "in_progress" | "submitted" | "graded";
  total_score: number | null;
  exam_title: string;
  exam_subject?: string;
  started_at?: string;
  submitted_at?: string;
  total_marks: number;
  answers: AttemptResultAnswer[];
  proctoring_events: AttemptResultProctoringEvent[];
  bloom_level_performance: Record<string, number>;
}

export interface AnswerReview {
  answer_id: string;
  question_id: string;
  question_text: string;
  question_type: string;
  model_answer?: string;
  student_answer?: string;
  marks_max: number;
  marks_awarded?: number;
  is_correct?: boolean;
  ai_feedback?: string;
  graded_by?: string;
  teacher_reviewed: boolean;
}

export interface GradeOverridePayload {
  marks_awarded: number;
  is_correct: boolean;
}

export interface GradeOverrideResponse {
  message: string;
  new_total_score: number;
}
