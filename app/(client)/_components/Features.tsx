"use client"
import { Bolt, Book, Brain, ChartBar, Eye, Shield } from "lucide-react";

const FEATURES = [
  {
    Icon: Brain,
    color: 'text-forest',
    bg: 'bg-forest/10',
    title: 'AI question generation',
    desc: 'Automatically generates scenario-based questions from uploaded PDFs or text material.',
  },
  {
    Icon: Shield,
    color: 'text-[#3C6459]',
    bg: 'bg-[#3C6459]/10',
    title: 'LLM-resistant design',
    desc: 'Questions require genuine reasoning across concepts — not answerable by pasting into ChatGPT.',
  },
  {
    Icon: Eye,
    color: 'text-brown',
    bg: 'bg-brown/10',
    title: 'Live proctoring',
    desc: 'Real-time gaze tracking, face detection, and tab-switch monitoring during sessions.',
  },
  {
    Icon: Bolt,
    color: 'text-sage',
    bg: 'bg-sage/10',
    title: 'Instant grading',
    desc: 'Automated MCQ scoring plus rubric-based AI grading for open short-answer questions.',
  },
  {
    Icon: Book,
    color: 'text-dk-forest',
    bg: 'bg-dk-forest/10',
    title: 'Student practice mode',
    desc: 'Students upload materials and practice independently with AI-generated questions and feedback.',
  },
  {
    Icon: ChartBar,
    color: 'text-tan',
    bg: 'bg-tan/10',
    title: 'Detailed analytics',
    desc: 'Per-student scores, anomaly timelines, and per-question answer explanations.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-19 px-7 bg-sand-light">
      <div className="max-w-content mx-auto grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16">

        {/* Heading — pinned left, stays in view as the list runs down on wide screens */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display text-[38px] leading-[1.1] text-[#2E2A3D] tracking-tight m-0 text-balance">
            Built for academic integrity
          </h2>
          <p className="text-[15px] text-bark leading-[1.7] mt-4 max-w-90">
            Every layer of PracticeHub exists to make cheating harder and grading
            faster — from how questions are written to how sessions are watched.
          </p>
        </div>

        {/* List — a continuous read, not a shelf of identical boxes */}
        <div className="flex flex-col">
          {FEATURES.map(({ Icon, bg, color, title, desc }, i) => (
            <div
              key={title}
              className={`flex items-start gap-5 py-6 ${i > 0 ? "border-t border-sand-border" : ""}`}
            >
              <div className={`w-11 h-11 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={19} className={color} aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-[15px] text-[#2E2A3D] mb-1">{title}</p>
                <p className="text-[13.5px] text-bark leading-[1.65] m-0 max-w-115">{desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}