"use client";

import { ShieldCheck, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

const sections = ["How it works", "Proctoring", "Pricing"];

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const dashboardHref = session?.role === "TEACHER" ? "/instructor" : "/student";

  return (
    <nav className="sticky top-0 z-100 bg-card border-b border-sand-border px-7">
      <div className="max-w-content mx-auto flex items-center h-16 gap-8">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-full bg-forest flex items-center justify-center">
            <ShieldCheck size={14} color="#fff" aria-hidden="true" />
          </div>
          <span className="font-display italic text-[18px] text-espresso tracking-tight">
            PracticeHub
          </span>
        </div>
        <div className="hidden md:flex gap-8 flex-1">
          {sections.map((label) => (
            <span key={label} className="text-sm text-bark">
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-5 ml-auto">
          {isAuthenticated ? (
            <>
              <Link
                href={dashboardHref}
                className="btn-ghost text-[13px] no-underline"
              >
                <LayoutDashboard size={14} aria-hidden="true" />
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-ghost text-[13px]"
              >
                <LogOut size={14} aria-hidden="true" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                className="btn-ghost text-[13px] no-underline"
                href="/login?role=STUDENT"
              >
                Log in as student
              </Link>
              <Link
                className="btn-ghost text-[13px] font-semibold no-underline"
                href="/login"
              >
                Log in as teacher
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
