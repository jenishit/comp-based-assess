"use client";

import { useUserStore } from "@/stores/userStore";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Settings,
  LogOut,
  GraduationCap,
  Menu,
  X,
  Upload,
  Key,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";

const teacherNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Exams", href: "/dashboard/exams", icon: FileText },
  { label: "Create Exam", href: "/dashboard/exams/new", icon: PlusCircle },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const studentNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Join Exam", href: "/dashboard/join", icon: Key },
  { label: "Upload PDF", href: "/dashboard/upload", icon: Upload },
  { label: "My Attempts", href: "/dashboard/attempts", icon: ClipboardList },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUserStore();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userType = session?.role || user?.role || "STUDENT";
  const isTeacher = userType === "proctor" || userType === "ADMIN" || userType === "TEACHER";
  const navItems = isTeacher ? teacherNav : studentNav;

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-espresso flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-6 h-16 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-forest flex items-center justify-center">
            <GraduationCap size={18} className="text-white" aria-hidden="true" />
          </div>
          <span className="font-semibold text-lg text-white tracking-tight">
            EduQuest
          </span>
          <span className="ml-auto text-[10px] font-medium text-sand uppercase tracking-wider border border-sand/30 rounded px-1.5 py-0.5">
            {isTeacher ? "Teacher" : "Student"}
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-2 lg:hidden text-sand hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                  active
                    ? "bg-forest text-white"
                    : "text-sand hover:bg-forest/20 hover:text-white"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sand hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer border-0 bg-transparent"
          >
            <LogOut size={18} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-sand-border flex items-center px-4 lg:px-6 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-bark hover:text-espresso transition-colors border-0 bg-transparent cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1" />

          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-espresso leading-tight">
                  {user.name}
                </p>
                <p className="text-xs text-bark">{user.email}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-forest flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
