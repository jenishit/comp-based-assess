import axiosInstance from "@/axios/instance";
import type {
  ExamSummary,
  ExamDetail,
  CreateExamPayload,
  CreatePracticeExamPayload,
  PracticeAttempt,
  JoinExamPayload,
  JoinExamResponse,
  RosterEntry,
  RosterUploadResponse,
} from "@/types/exam-types";
import type { QuestionJob } from "@/types/exam-types";
import type {
  AttemptQuestion,
  SubmitAnswerPayload,
  AttemptSummary,
  AttemptDetail,
  AttemptResult,
  AnswerReview,
  GradeOverridePayload,
  GradeOverrideResponse,
} from "@/types/attempt-types";
import type { EvidenceCapture, GazeSample } from "@/types/proctoring-types";
import type { UploadFileResponse, PresignedUploadResponse } from "@/types/upload-types";
import type { EnrollmentPayload } from "@/types/enrollment-types";

export interface AttemptExam {
  exam_id: string;
  title: string;
  subject?: string;
  duration_minutes: number;
  require_seb?: boolean;
  // The backend's ground truth for whether this attempt is still live — see
  // useExamAttempt's initial-load check. Never assume "in_progress" just
  // because this attempt_id resolves; it may already have been submitted
  // (normally, on timeout, or on a proctoring termination) in a different
  // tab/session.
  status: "in_progress" | "submitted" | "graded";
  started_at?: string;
}

export const examCreateService = async (payload: CreateExamPayload): Promise<ExamDetail> => {
  const response = await axiosInstance.post("/exams/", payload);
  return response.data;
};

export const examGetService = async (examId: string): Promise<ExamDetail> => {
  const response = await axiosInstance.get(`/exams/${examId}`);
  return response.data;
};

export const examListService = async (): Promise<ExamSummary[]> => {
  const response = await axiosInstance.get("/exams/");
  return response.data;
};

export const examJoinService = async (payload: JoinExamPayload): Promise<JoinExamResponse> => {
  const response = await axiosInstance.post("/exams/join", payload);
  return response.data;
};

export const examPracticeCreateService = async (payload: CreatePracticeExamPayload): Promise<ExamDetail> => {
  const response = await axiosInstance.post("/exams/practice", payload);
  return response.data;
};

export const examPracticeStartService = async (examId: string): Promise<PracticeAttempt> => {
  const response = await axiosInstance.post(`/exams/${examId}/start`);
  return response.data;
};

export const examRosterGetService = async (examId: string): Promise<RosterEntry[]> => {
  const response = await axiosInstance.get(`/exams/${examId}/roster`);
  return response.data;
};

export const examRosterUploadService = async (
  examId: string,
  entries: { name: string; email: string }[],
): Promise<RosterUploadResponse> => {
  const response = await axiosInstance.post(`/exams/${examId}/roster`, { entries });
  return response.data;
};

export const examRosterEntryDeleteService = async (examId: string, entryId: string): Promise<void> => {
  await axiosInstance.delete(`/exams/${examId}/roster/${entryId}`);
};

export const attemptExamGetService = async (attemptId: string): Promise<AttemptExam> => {
  const response = await axiosInstance.get(`/attempts/${attemptId}/exam`);
  return response.data;
};

export const attemptQuestionsGetService = async (attemptId: string): Promise<AttemptQuestion[]> => {
  const response = await axiosInstance.get(`/attempts/${attemptId}/questions`);
  return response.data;
};

export const attemptAnswerSubmitService = async (
  attemptId: string,
  payload: SubmitAnswerPayload | SubmitAnswerPayload[],
): Promise<void> => {
  await axiosInstance.post(`/attempts/${attemptId}/answers`, payload);
};

export const attemptSubmitService = async (attemptId: string): Promise<void> => {
  await axiosInstance.post(`/attempts/${attemptId}/submit`);
};

export const attemptListService = async (): Promise<AttemptSummary[]> => {
  const response = await axiosInstance.get("/attempts/");
  return response.data;
};

export const attemptMyListService = async (): Promise<AttemptSummary[]> => {
  const response = await axiosInstance.get("/attempts/me");
  return response.data;
};

export const attemptGetService = async (attemptId: string): Promise<AttemptDetail> => {
  const response = await axiosInstance.get(`/attempts/${attemptId}`);
  return response.data;
};

export const attemptResultGetService = async (attemptId: string): Promise<AttemptResult> => {
  const response = await axiosInstance.get(`/attempts/${attemptId}/result`);
  return response.data;
};

export const attemptReviewGetService = async (attemptId: string): Promise<AnswerReview[]> => {
  const response = await axiosInstance.get(`/attempts/${attemptId}/review`);
  return response.data;
};

export const attemptAnswerReviewPatchService = async (
  attemptId: string,
  answerId: string,
  payload: GradeOverridePayload,
): Promise<GradeOverrideResponse> => {
  const response = await axiosInstance.patch(`/attempts/${attemptId}/answers/${answerId}/review`, payload);
  return response.data;
};

export const attemptGazeSamplesGetService = async (attemptId: string): Promise<GazeSample[]> => {
  const response = await axiosInstance.get(`/attempts/${attemptId}/gaze-samples`);
  return response.data;
};

export const enrollmentSubmitService = async (attemptId: string, payload: EnrollmentPayload): Promise<void> => {
  await axiosInstance.post(`/enrollment/${attemptId}`, payload);
};

export const attemptFaceVerificationService = async (attemptId: string, embedding: number[]): Promise<void> => {
  await axiosInstance.post(`/attempts/${attemptId}/face-verification`, { embedding });
};

export const filePresignedUploadGetService = async (): Promise<PresignedUploadResponse> => {
  const response = await axiosInstance.get("/files/presigned-upload");
  return response.data;
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // keep in sync with backend MAX_UPLOAD_BYTES

/**
 * Uploads a PDF straight to object storage via a presigned POST. The POST
 * policy signed by the backend enforces the 10 MB cap and PDF content type
 * at the storage layer; the size pre-check here just gives a friendlier
 * error than a raw S3 policy rejection. Returns the file_id (file_key
 * without ".pdf") used by question generation.
 */
export const uploadPdfDirectService = async (file: File): Promise<string> => {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("PDF is larger than the 10 MB limit");
  }
  const { upload_url, file_key, fields } = await filePresignedUploadGetService();

  const formData = new FormData();
  Object.entries(fields ?? {}).forEach(([key, value]) => formData.append(key, value));
  // S3 requires the file part to come last in a presigned POST.
  formData.append("file", file);

  const uploadRes = await fetch(upload_url, { method: "POST", body: formData });
  if (!uploadRes.ok) throw new Error("Direct upload failed");

  return file_key.replace(".pdf", "");
};

export const fileUploadService = async (file: File): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post("/files/upload", formData);
  return response.data;
};

// ── Live monitoring (WebSocket tickets) ─────────────────────────────────────

/** Mint a single-use ticket authorizing one WebSocket connection to either an
 * attempt channel or a whole-exam channel (teacher only). */
export const wsTicketService = async (
  target: { attemptId: string } | { examId: string },
): Promise<string> => {
  const payload = "attemptId" in target ? { attempt_id: target.attemptId } : { exam_id: target.examId };
  const response = await axiosInstance.post("/ws/ticket", payload);
  return response.data.ticket;
};

export const attemptEvidenceListService = async (attemptId: string): Promise<EvidenceCapture[]> => {
  const response = await axiosInstance.get(`/attempts/${attemptId}/evidence`);
  return response.data;
};

export const questionGenerateService = async (
  payload: { file_id: string; count: number; types: string[] },
  config?: { skipGlobalSignOut?: boolean },
): Promise<{ job_id: string }> => {
  const response = await axiosInstance.post("/questions/generate", payload, {
    _skipGlobalSignOut: config?.skipGlobalSignOut,
  });
  return response.data;
};

export const questionJobGetService = async (jobId: string): Promise<QuestionJob> => {
  const response = await axiosInstance.get(`/questions/jobs/${jobId}`);
  return response.data;
};

export const questionGenerationStatusGetService = async (examId: string): Promise<QuestionJob> => {
  const response = await axiosInstance.get(`/questions/exams/${examId}/generation-status`);
  return response.data;
};
