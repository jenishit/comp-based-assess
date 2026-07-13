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
    color: 'text-[#6B7C3F]',
    bg: 'bg-[#6B7C3F]/10',
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
    <section id="features" className="py-17 px-7 bg-sand-light">
      <div className="max-w-content mx-auto">

        {/* Heading */}
        <div className="text-center mb-9.5">
          <p className="text-xs font-medium text-forest uppercase tracking-[1.2px] mb-2.5">
            What you get
          </p>
          <h2 className="text-[32px] font-medium text-[#1A100A] tracking-tight m-0">
            Built for academic integrity
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ Icon, bg, color, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-xl p-5 border border-sand-border
                         hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-[10px] ${bg} flex items-center
                               justify-content mb-3`}
                   style={{ justifyContent: "center" }}>
                <Icon size={20} className={color} aria-hidden="true" />
              </div>
              <p className="font-medium text-sm text-[#1A100A] mb-1.5">{title}</p>
              <p className="text-[12.5px] text-bark leading-[1.6] m-0">{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}