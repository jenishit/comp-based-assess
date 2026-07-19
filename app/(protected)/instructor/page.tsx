"use client";

import { useUserStore } from "@/stores/userStore";
import { useSession } from "next-auth/react";
import { FileText, Users, Clock, Activity, Key, Upload, ClipboardList, PlusCircle, Settings } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading } = useUserStore();
  const { data: session } = useSession();

  const userType = session?.role || user?.role || "STUDENT";
  const isTeacher = userType === "proctor" || userType === "ADMIN" || userType === "TEACHER";

  if (isTeacher) {
    const stats = [
      { label: "Total Exams", value: "--", icon: FileText, color: "text-forest" },
      { label: "Total Students", value: "--", icon: Users, color: "text-sage" },
      { label: "Active Sessions", value: "--", icon: Activity, color: "text-olive" },
      { label: "Avg. Duration", value: "--", icon: Clock, color: "text-bark" },
    ];

    return (
      <div className="max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-espresso tracking-tight">
            {loading ? "Welcome back" : `Welcome back${user?.name ? `, ${user?.name?.split(" ")[0]}` : ""}`}
          </h1>
          <p className="text-bark text-sm mt-1">Manage your exams and monitor student progress.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-sand-border p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Icon size={16} className={color} aria-hidden="true" />
                <span className="text-xs font-medium text-bark uppercase tracking-wide">{label}</span>
              </div>
              <span className="text-2xl font-semibold text-espresso">{value}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-sand-border p-5">
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
              <SettingsIcon size={16} className="inline mr-2 mb-0.5" />
              Account settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const studentStats = [
    { label: "Exams Taken", value: "--", icon: ClipboardList, color: "text-forest" },
    { label: "Avg. Score", value: "--", icon: Activity, color: "text-sage" },
    { label: "Upcoming", value: "--", icon: Clock, color: "text-olive" },
    { label: "Files Uploaded", value: "--", icon: Upload, color: "text-bark" },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-espresso tracking-tight">
          {loading ? "Welcome back" : `Welcome back${user?.name ? `, ${user?.name?.split(" ")[0]}` : ""}`}
        </h1>
        <p className="text-bark text-sm mt-1">Track your assessments and upload course materials.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {studentStats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-sand-border p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon size={16} className={color} aria-hidden="true" />
              <span className="text-xs font-medium text-bark uppercase tracking-wide">{label}</span>
            </div>
            <span className="text-2xl font-semibold text-espresso">{value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-sand-border p-5">
        <h2 className="text-base font-semibold text-espresso mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link href="/instructor/join" className="block rounded-lg border border-sand-border bg-cream px-4 py-3.5 text-sm font-medium text-espresso hover:bg-sand-light hover:border-sage transition-colors no-underline">
            <Key size={16} className="inline mr-2 mb-0.5" />
            Join an exam
          </Link>
          <Link href="/instructor/upload" className="block rounded-lg border border-sand-border bg-cream px-4 py-3.5 text-sm font-medium text-espresso hover:bg-sand-light hover:border-sage transition-colors no-underline">
            <Upload size={16} className="inline mr-2 mb-0.5" />
            Upload study material
          </Link>
          <Link href="/instructor/attempts" className="block rounded-lg border border-sand-border bg-cream px-4 py-3.5 text-sm font-medium text-espresso hover:bg-sand-light hover:border-sage transition-colors no-underline">
            <ClipboardList size={16} className="inline mr-2 mb-0.5" />
            View my attempts
          </Link>
        </div>
      </div>
    </div>
  );
}

function SettingsIcon({ size, className }: { size: number; className?: string }) {
  return <Settings size={size} className={className} />;
}
