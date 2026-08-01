import axiosInstance from "@/axios/instance";
import type {
  ExamSummary,
  ExamDetail,
  CreateExamPayload,
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
} from "@/types/attempt-types";
import type { GazeSample } from "@/types/proctoring-types";
import type { UploadFileResponse, PresignedUploadResponse } from "@/types/upload-types";

export interface AttemptExam {
  exam_id: string;
  title: string;
  subject?: string;
  duration_minutes: number;
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
  payload: SubmitAnswerPayload,
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

export const attemptGetService = async (attemptId: string): Promise<AttemptDetail> => {
  const response = await axiosInstance.get(`/attempts/${attemptId}`);
  return response.data;
};

export const attemptGazeSamplesGetService = async (attemptId: string): Promise<GazeSample[]> => {
  const response = await axiosInstance.get(`/attempts/${attemptId}/gaze-samples`);
  return response.data;
};

export const filePresignedUploadGetService = async (): Promise<PresignedUploadResponse> => {
  const response = await axiosInstance.get("/files/presigned-upload");
  return response.data;
};

export const fileUploadService = async (file: File): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post("/files/upload", formData);
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
