"use client";

import { ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface HeroProps {
  onOpenStudent: () => void;
  isAuthenticated: boolean;
  dashboardHref: string;
}

export default function Hero({ onOpenStudent, isAuthenticated, dashboardHref }: HeroProps) {
  return (
    <section className="relative px-7 pt-20 pb-24 max-w-content mx-auto text-center overflow-hidden">
      {/* Decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-25 left-1/2 -translate-x-1/2 w-170 h-110"
        style={{
          background:
            "radial-gradient(circle, rgba(75,123,110,0.16), rgba(217,164,65,0.12) 55%, transparent 75%)",
          filter: "blur(14px)",
        }}
      />

      <div className="relative animate-fade-up">
        <span className="inline-block text-xs mb-5 px-3 py-1 rounded-full font-semibold text-[#9A6E1F] bg-gold-soft">
          Built for calmer test days
        </span>

        <h1 className="font-display text-5xl md:text-6xl leading-tight mb-6 text-espresso tracking-tight text-balance">
          Exams that don&apos;t
          <br />
          feel like exams.
        </h1>

        <p className="text-lg max-w-xl mx-auto mb-10 text-bark">
          Upload your material, set the terms, and let EduQuest handle the
          watching — so everyone in the room can{" "}
          <span className="font-display italic text-espresso">
            just focus on the questions
          </span>
          .
        </p>

        {isAuthenticated ? (
          <Link
            href={dashboardHref}
            className="btn-primary inline-flex px-6 py-3 text-[15px] no-underline"
          >
            <LayoutDashboard size={17} aria-hidden="true" />
            Go to dashboard
          </Link>
        ) : (
          <div className="flex flex-col md:flex-row gap-5 max-w-2xl mx-auto text-left">
            {/* For teachers */}
            <div className="flex-1 rounded-3xl p-7 bg-espresso">
              <div className="text-xs mb-2 font-medium text-white/55">For teachers</div>
              <div className="font-display text-xl mb-4 text-white">Teaching a class?</div>
              <p className="text-sm mb-5 text-white/70">
                Build a proctored exam from any PDF in a few minutes.
              </p>
              <Link
                href="/signup?role=TEACHER"
                className="btn-on-dark w-full py-2.5 rounded-xl text-sm no-underline"
              >
                Get started — it&apos;s free <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            {/* For students */}
            <div className="surface-card flex-1 rounded-3xl p-7">
              <div className="text-xs mb-2 font-medium text-bark">For students</div>
              <div className="font-display text-xl mb-3 text-espresso">Have a PIN?</div>
              <p className="text-sm text-bark">
                Your teacher will share a 6-digit code when it&apos;s time.
              </p>

              <div className="ticket-perforation my-4 border-t-2 border-dashed border-sand-border" />

              <div className="flex gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-9 rounded-lg flex items-center justify-center text-sm font-mono bg-card border border-sand-border text-muted-light"
                  >
                    •
                  </div>
                ))}
              </div>

              <button
                onClick={onOpenStudent}
                className="btn-ghost text-xs mt-3 font-medium text-forest-dark"
              >
                Enter exam <ArrowRight size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
