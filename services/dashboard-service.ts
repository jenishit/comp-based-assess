import axiosInstance from "@/axios/instance";
import type { StudentDashboardStats, TeacherDashboardStats } from "@/types/dashboard-types";

export const teacherDashboardStatsGetService = async (): Promise<TeacherDashboardStats> => {
  const response = await axiosInstance.get("/dashboard/teacher");
  return response.data;
};

export const studentDashboardStatsGetService = async (): Promise<StudentDashboardStats> => {
  const response = await axiosInstance.get("/dashboard/student");
  return response.data;
};
