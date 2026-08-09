"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/user-store";
import { useSession } from "next-auth/react";
import { FileText, Users, Clock, Activity, Key, Upload, ClipboardList, PlusCircle, Settings } from "lucide-react";
import Link from "next/link";
import { studentDashboardStatsGetService, teacherDashboardStatsGetService } from "@/services/dashboard-service";
import type { StudentDashboardStats, TeacherDashboardStats } from "@/types/dashboard-types";

function formatDuration(minutes: number | null): string {
  if (minutes === null) return "--";
  return minutes < 1 ? "<1 min" : `${Math.round(minutes)} min`;
}

function formatPercent(pct: number | null): string {
  return pct === null ? "--" : `${pct}%`;
}

export default function DashboardHome() {
  const { user, loading } = useUserStore();
  const { data: session } = useSession();
  const [teacherStats, setTeacherStats] = useState<TeacherDashboardStats | null>(null);
  const [studentStatsData, setStudentStatsData] = useState<StudentDashboardStats | null>(null);

  const userType = session?.role || user?.role || "STUDENT";
  const isTeacher = userType === "TEACHER";

  useEffect(() => {
    if (isTeacher) {
      teacherDashboardStatsGetService().then(setTeacherStats).catch(() => {});
    } else {
      studentDashboardStatsGetService().then(setStudentStatsData).catch(() => {});
    }
  }, [isTeacher]);

  if (isTeacher) {
    const stats = [
      { label: "Total Exams", value: teacherStats ? String(teacherStats.total_exams) : "--", icon: FileText, color: "text-forest" },
      { label: "Total Students", value: teacherStats ? String(teacherStats.total_students) : "--", icon: Users, color: "text-sage" },
      { label: "Active Sessions", value: teacherStats ? String(teacherStats.active_sessions) : "--", icon: Activity, color: "text-olive" },
      { label: "Avg. Duration", value: teacherStats ? formatDuration(teacherStats.avg_duration_minutes) : "--", icon: Clock, color: "text-bark" },
    ];

    return (
      <div className="max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-medium text-espresso tracking-tight">
            {loading ? "Welcome back" : `Welcome back${user?.name ? `, ${user?.name?.split(" ")[0]}` : ""}`}
          </h1>
          <p className="text-bark text-sm mt-1">Manage your exams and monitor student progress.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card rounded-xl border border-sand-border p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Icon size={16} className={color} aria-hidden="true" />
                <span className="text-xs font-medium text-bark uppercase tracking-wide">{label}</span>
              </div>
              <span className="text-2xl font-semibold text-espresso">{value}</span>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-sand-border p-5">
          <h2 className="text-base font-semibold text-espresso mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link href="/instructor/exams/new" className="block rounded-lg border border-sand-border bg-cream px-4 py-3.5 text-sm font-medium text-espresso hover:bg-sand-light hover:border-sage transition-colors no-underline">
              <PlusCircle size={16} className="inline mr-2 mb-0.5" />
              Create a new exam
            </Link>
            <Link href="/instructor/exams" className="block rounded-lg border border-sand-border bg-cream px-4 py-3.5 text-sm font-medium text-espresso hover:bg-sand-light hover:border-sage transition-colors no-underline">
              <FileText size={16} className="inline mr-2 mb-0.5" />
              View existing exams
            </Link>
            <Link href="/instructor/settings" className="block rounded-lg border border-sand-border bg-cream px-4 py-3.5 text-sm font-medium text-espresso hover:bg-sand-light hover:border-sage transition-colors no-underline">
              <Settings size={16} className="inline mr-2 mb-0.5" />
              Account settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const studentStats = [
    { label: "Exams Taken", value: studentStatsData ? String(studentStatsData.exams_taken) : "--", icon: ClipboardList, color: "text-forest" },
    { label: "Avg. Score", value: studentStatsData ? formatPercent(studentStatsData.avg_score_pct) : "--", icon: Activity, color: "text-sage" },
    { label: "Upcoming", value: studentStatsData ? String(studentStatsData.upcoming) : "--", icon: Clock, color: "text-olive" },
    { label: "Practice Exams", value: studentStatsData ? String(studentStatsData.files_uploaded) : "--", icon: Upload, color: "text-bark" },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-medium text-espresso tracking-tight">
          {loading ? "Welcome back" : `Welcome back${user?.name ? `, ${user?.name?.split(" ")[0]}` : ""}`}
        </h1>
        <p className="text-bark text-sm mt-1">Track your assessments and upload course materials.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {studentStats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-sand-border p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon size={16} className={color} aria-hidden="true" />
              <span className="text-xs font-medium text-bark uppercase tracking-wide">{label}</span>
            </div>
            <span className="text-2xl font-semibold text-espresso">{value}</span>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-sand-border p-5">
        <h2 className="text-base font-semibold text-espresso mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link href="/student/join" className="block rounded-lg border border-sand-border bg-cream px-4 py-3.5 text-sm font-medium text-espresso hover:bg-sand-light hover:border-sage transition-colors no-underline">
            <Key size={16} className="inline mr-2 mb-0.5" />
            Join an exam
          </Link>
          <Link href="/student/practice" className="block rounded-lg border border-sand-border bg-cream px-4 py-3.5 text-sm font-medium text-espresso hover:bg-sand-light hover:border-sage transition-colors no-underline">
            <Upload size={16} className="inline mr-2 mb-0.5" />
            Upload study material
          </Link>
          <Link href="/student/attempts" className="block rounded-lg border border-sand-border bg-cream px-4 py-3.5 text-sm font-medium text-espresso hover:bg-sand-light hover:border-sage transition-colors no-underline">
            <ClipboardList size={16} className="inline mr-2 mb-0.5" />
            View my attempts
          </Link>
        </div>
      </div>
    </div>
  );
}
