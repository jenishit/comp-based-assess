"use client";

import { Zap, Key, GraduationCap } from "lucide-react";

interface HeroProps {
  onOpenInstructor: () => void;
  onOpenStudent: () => void;
}

export default function Hero({ onOpenInstructor, onOpenStudent }: HeroProps) {
  const options = [
    { label: "A", text: "Increase training volume", selected: false },
    { label: "B", text: "Apply SMOTE to minority class", selected: true },
    { label: "C", text: "Reduce the learning rate", selected: false },
    { label: "D", text: "Switch to recall metrics", selected: false },
  ];

  return (
    <section className="bg-espresso py-17 px-7 overflow-hidden relative">
      {/* Decorative blob */}
      <div
        aria-hidden="true"
        className="absolute -top-20 right-0 w-90 h-90 rounded-full
                   bg-forest/10 pointer-events-none"
      />

      <div className="max-w-content mx-auto flex gap-13 items-center flex-wrap">
        {/* ── Copy ── */}
        <div className="flex-1 min-w-90">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-1.5 bg-forest/20 border border-forest
                          rounded-full px-3 py-1 mb-5"
          >
            <Zap size={11} color="#7FB069" aria-hidden="true" />
            <span className="text-xs font-medium text-sage">
              AI-powered assessment platform
            </span>
          </div>

          <h1 className="text-[44px] font-medium leading-[1.1] text-white m-0 mb-4 tracking-tight">
            Exams that actually
            <br />
            <span className="text-sage">test understanding</span>
          </h1>

          <p className="text-[15.5px] text-[#B8AEA8] leading-[1.75] max-w-107.5 m-0 mb-8">
            Generate scenario-based questions from any course material, run
            secure online exams with live proctoring, and get instant results —
            all in one platform.
          </p>

          <div className="flex gap-2.5 flex-wrap">
            <button
              onClick={onOpenInstructor}
              className="inline-flex items-center gap-2 px-5.5 py-3 rounded-xl border-0
                         bg-forest text-white text-[15px] font-medium cursor-pointer
                         hover:bg-forest-dark transition-colors"
            >
              <GraduationCap size={17} aria-hidden="true" />
              Instructor portal
            </button>
            <button
              onClick={onOpenStudent}
              className="inline-flex items-center gap-2 px-5.5 py-3 rounded-xl
                         bg-transparent text-white text-[15px] font-medium cursor-pointer
                         border-[1.5px] border-white/25 hover:border-white/50 transition-colors"
            >
              <Key size={17} aria-hidden="true" />
              Join with PIN
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-7.5 mt-9.5">
            {[
              { val: "2,400+", label: "Exams created" },
              { val: "98%", label: "Grading accuracy" },
              { val: "150+", label: "Institutions" },
            ].map(({ val, label }) => (
              <div key={label}>
                <div className="text-2xl font-medium text-sage">{val}</div>
                <div className="text-xs text-[#7A6E68] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mock exam card ── */}
        <div className="flex-[0_0_330px]" aria-hidden="true">
          <div className="bg-white rounded-[14px] overflow-hidden border border-sand-border">
            {/* Card header */}
            <div className="bg-forest px-4 py-3 flex justify-between items-center">
              <div>
                <div className="text-[13px] font-medium text-white">
                  Intro to machine learning
                </div>
                <div className="text-[11px] text-sage mt-0.5">
                  12 questions · 45 min
                </div>
              </div>
              <span
                className="bg-sage/25 border border-sage rounded-[5px] px-2 py-0.5
                               text-[10px] font-medium text-white"
              >
                LIVE
              </span>
            </div>

            {/* Question body */}
            <div className="p-3.75">
              <div className="text-[10px] font-medium text-sand uppercase tracking-[0.7px] mb-1.5">
                Question 3 of 12
              </div>
              <div
                className="text-[12.5px] text-[#2A1A0E] leading-[1.55] p-[10px_11px]
                              bg-sand-light rounded-[7px] mb-3"
              >
                A diagnostic model shows 94% test accuracy but 61% in
                deployment. Given class imbalance, which strategy best resolves
                this gap?
              </div>

              {options.map(({ label, text, selected }) => (
                <div
                  key={label}
                  className={`flex items-center gap-1.5 px-2.5 py-3.75 rounded-1.5
                              mb-1 border-[1.5px] transition-none
                              ${
                                selected
                                  ? "border-forest bg-forest/10"
                                  : "border-sand-border bg-white"
                              }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full shrink-0 flex items-center
                                justify-content text-[9.5px] font-medium
                                ${selected ? "bg-forest text-white" : "bg-sand-light text-bark"}`}
                    style={{ justifyContent: "center" }}
                  >
                    {label}
                  </div>
                  <span
                    className={`text-[11.5px] ${
                      selected
                        ? "text-forest-dark font-medium"
                        : "text-[#5A4A3A]"
                    }`}
                  >
                    {text}
                  </span>
                </div>
              ))}

              {/* Progress */}
              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] text-sand mb-1">
                  <span>Progress</span>
                  <span>3 / 12</span>
                </div>
                <div className="h-0.75 bg-sand-border rounded-full">
                  <div className="h-full w-1/4 bg-forest rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
