"use client";
import { Key, GraduationCap, LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface CtaBannerProps {
  onOpenStudent: () => void;
  isAuthenticated: boolean;
  dashboardHref: string;
}

export default function CTABanner({
  onOpenStudent,
  isAuthenticated,
  dashboardHref,
}: CtaBannerProps) {
  return (
    <section className="py-17 px-7 bg-espresso">
      <div className="max-w-155 mx-auto text-center">
        <h2 className="font-display text-[36px] text-white tracking-tight mb-3 text-balance">
          Ready to transform your assessments?
        </h2>
        <p className="text-[15px] text-[#B8AEA8] leading-[1.7] mb-8">
          Join educators using AI-generated, LLM-resistant questions to run
          exams that actually measure understanding.
        </p>
        <div className="flex gap-2.5 justify-center flex-wrap">
          {isAuthenticated ? (
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-2 px-5.5 py-3 rounded-xl border-0
                         bg-forest text-white text-[15px] font-medium cursor-pointer
                         hover:bg-forest-dark transition-colors no-underline"
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup?role=TEACHER"
                className="inline-flex items-center gap-2 px-5.5 py-3 rounded-xl border-0
                           bg-forest text-white text-[15px] font-medium cursor-pointer
                           hover:bg-forest-dark transition-colors no-underline"
              >
                <GraduationCap size={16} aria-hidden="true" />
                Get started as instructor
              </Link>
              <button
                onClick={onOpenStudent}
                className="inline-flex items-center gap-2 px-5.5 py-3 rounded-xl
                           bg-transparent text-white text-[15px] font-medium cursor-pointer
                           border-[1.5px] border-white/25 hover:border-white/50 transition-colors"
              >
                <Key size={16} aria-hidden="true" />
                Student join
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
