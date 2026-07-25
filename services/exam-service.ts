import axiosInstance from '@/axios/instance';
import type {
  ExamSummary, ExamDetail, CreateExamPayload,
  JoinExamPayload, JoinExamResponse, QuestionJob,
  AttemptQuestion, SubmitAnswerPayload, AttemptSummary,
  AttemptDetail, GazeSample, UploadFileResponse,
} from '@/types/exam';

export interface AttemptExam {
  exam_id: string;
  title: string;
  subject?: string;
  duration_minutes: number;
}

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
  getExam: async (attemptId: string): Promise<AttemptExam> => {
    const res = await axiosInstance.get(`/attempts/${attemptId}/exam`);
    return res.data;
  },

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

  get: async (attemptId: string): Promise<AttemptDetail> => {
    const res = await axiosInstance.get(`/attempts/${attemptId}`);
    return res.data;
  },

  getGazeSamples: async (attemptId: string): Promise<GazeSample[]> => {
    const res = await axiosInstance.get(`/attempts/${attemptId}/gaze-samples`);
    return res.data;
  },
};

export const fileService = {
  upload: async (file: File): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post('/files/upload', formData);
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
