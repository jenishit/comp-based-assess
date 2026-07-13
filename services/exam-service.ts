import axiosInstance from '@/axios/instance';
import type {
  ExamSummary, ExamDetail, CreateExamPayload,
  JoinExamPayload, JoinExamResponse, QuestionJob,
  AttemptQuestion, SubmitAnswerPayload, AttemptSummary,
  UploadFileResponse,
} from '@/types/exam';

export const examService = {
  create: async (payload: CreateExamPayload): Promise<ExamDetail> => {
    const res = await axiosInstance.post('/exams/', payload);
    return res.data;
  },

  get: async (examId: string): Promise<ExamDetail> => {
    const res = await axiosInstance.get(`/exams/${examId}`);
    return res.data;
  },

  list: async (): Promise<ExamSummary[]> => {
    const res = await axiosInstance.get('/exams/');
    return res.data;
  },

  join: async (payload: JoinExamPayload): Promise<JoinExamResponse> => {
    const res = await axiosInstance.post('/exams/join', payload);
    return res.data;
  },
};

export const attemptService = {
  getQuestions: async (attemptId: string): Promise<AttemptQuestion[]> => {
    const res = await axiosInstance.get(`/attempts/${attemptId}/questions`);
    return res.data;
  },

  submitAnswer: async (attemptId: string, payload: SubmitAnswerPayload): Promise<void> => {
    await axiosInstance.post(`/attempts/${attemptId}/answers`, payload);
  },

  submitAttempt: async (attemptId: string): Promise<void> => {
    await axiosInstance.post(`/attempts/${attemptId}/submit`);
  },

  list: async (): Promise<AttemptSummary[]> => {
    const res = await axiosInstance.get('/attempts/');
    return res.data;
  },

  get: async (attemptId: string): Promise<{ attempt: AttemptSummary; answers: any[]; proctoring_events: any[] }> => {
    const res = await axiosInstance.get(`/attempts/${attemptId}`);
    return res.data;
  },
};

export const fileService = {
  upload: async (file: File): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const questionService = {
  generate: async (payload: { file_id: string; count: number; types: string[] }): Promise<{ job_id: string }> => {
    const res = await axiosInstance.post('/questions/generate', payload);
    return res.data;
  },

  getJob: async (jobId: string): Promise<QuestionJob> => {
    const res = await axiosInstance.get(`/questions/jobs/${jobId}`);
    return res.data;
  },
};
