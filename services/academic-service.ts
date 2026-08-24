import axiosInstance from "@/axios/instance";
import type { Subject, Group, GroupMember, GroupMemberEntry, AnnualReport, ExamBloomReport } from "@/types/academic-types";

// ── Subjects ──────────────────────────────────────────────

export const subjectCreateService = async (name: string): Promise<Subject> => {
  const response = await axiosInstance.post("/academic/subjects", { name });
  return response.data;
};

export const subjectListService = async (): Promise<Subject[]> => {
  const response = await axiosInstance.get("/academic/subjects");
  return response.data;
};

export const subjectUpdateService = async (subjectId: string, name: string): Promise<Subject> => {
  const response = await axiosInstance.put(`/academic/subjects/${subjectId}`, { name });
  return response.data;
};

export const subjectDeleteService = async (subjectId: string): Promise<void> => {
  await axiosInstance.delete(`/academic/subjects/${subjectId}`);
};

// ── Groups ────────────────────────────────────────────────

export const groupCreateService = async (name: string, term: string, subjectId?: string): Promise<Group> => {
  const response = await axiosInstance.post("/academic/groups", { name, term, subject_id: subjectId || null });
  return response.data;
};

export const groupListService = async (): Promise<Group[]> => {
  const response = await axiosInstance.get("/academic/groups");
  return response.data;
};

export const groupUpdateService = async (
  groupId: string,
  name: string,
  term: string,
  subjectId?: string,
): Promise<Group> => {
  const response = await axiosInstance.put(`/academic/groups/${groupId}`, {
    name,
    term,
    subject_id: subjectId || null,
  });
  return response.data;
};

export const groupDeleteService = async (groupId: string): Promise<void> => {
  await axiosInstance.delete(`/academic/groups/${groupId}`);
};

// ── Group members ─────────────────────────────────────────

export const groupMembersListService = async (groupId: string): Promise<GroupMember[]> => {
  const response = await axiosInstance.get(`/academic/groups/${groupId}/members`);
  return response.data;
};

export const groupMemberAddService = async (groupId: string, studentId: string): Promise<void> => {
  await axiosInstance.post(`/academic/groups/${groupId}/members`, { student_id: studentId });
};

export const groupMemberBulkAddService = async (
  groupId: string,
  entries: GroupMemberEntry[],
): Promise<GroupMember[]> => {
  const response = await axiosInstance.post(`/academic/groups/${groupId}/members/bulk`, { entries });
  return response.data;
};

export const groupMemberRemoveService = async (groupId: string, studentId: string): Promise<void> => {
  await axiosInstance.delete(`/academic/groups/${groupId}/members/${studentId}`);
};

// ── Annual report ─────────────────────────────────────────

export const annualReportGetService = async (studentId: string, term: string): Promise<AnnualReport> => {
  const response = await axiosInstance.get(`/reports/annual/${studentId}`, { params: { term } });
  return response.data;
};

export const examBloomReportGetService = async (examId: string): Promise<ExamBloomReport> => {
  const response = await axiosInstance.get(`/reports/exam/${examId}/bloom`);
  return response.data;
};

export const myBloomReportGetService = async (): Promise<ExamBloomReport> => {
  const response = await axiosInstance.get(`/reports/me/bloom`);
  return response.data;
};
