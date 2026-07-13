'use client';

import { Award, Book, Brain, ChartBar, Key, Pencil, School, Target, Upload, User } from 'lucide-react';
import { useState } from 'react';

const STEPS = {
  instructor: [
    { icon: 'upload', t: 'Upload materials', d: 'Upload a PDF or paste text — the system reads and indexes your content.' },
    { icon: ' target', t: 'Configure exam', d: 'Set MCQ count, short-answer count, and the exam duration.' },
    { icon: ' brain', t: 'Review questions', d: 'AI generates scenario-based questions. Edit or approve before publishing.' },
    { icon: ' key', t: 'Share PIN', d: 'A unique 6-digit PIN is generated. Share it or send a direct join link.' },
    { icon: ' chart-bar', t: 'Review results', d: 'See scores, flagged events, and per-question breakdowns per student.' },
  ],
  student: [
    { icon: ' key', t: 'Enter PIN or link', d: 'No account required. Enter the 6-digit PIN or follow the teacher\'s link.' },
    { icon: ' user', t: 'Provide details', d: 'Enter your name and email so the instructor can identify your submission.' },
    { icon: ' pencil', t: 'Take the exam', d: 'Answer questions within the time limit under live monitoring.' },
    { icon: ' award', t: 'See results', d: 'Instant score with per-question explanations of what was correct.' },
    { icon: ' book-2', t: 'Practice anytime', d: 'Create a free account to generate practice quizzes from any document.' },
  ],
};


const iconMap: Record<string, React.ElementType> = {
  ' upload': Upload,
  ' target': Target,
  ' brain': Brain,
  ' key': Key,
  ' chart-bar': ChartBar,
  ' user': User,
  ' pencil': Pencil,
  ' award': Award,
  ' book': Book,
};

export default function HowItWorks() {
  const [tab, setTab] = useState<'instructor' | 'student'>('instructor');
  const steps = STEPS[tab];

  return (
    <section className="py-16 px-6 md:px-8 bg-cream">
      <div className="max-w-265 mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-medium text-forest uppercase tracking-widest">Workflow</p>
          <h2 className="text-3xl md:text-4xl font-medium text-dark tracking-tight mt-2">How EduQuest works</h2>
          <p className="text-sm text-brown mt-2">End‑to‑end flows for instructors and students.</p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-tan-alt rounded-xl p-1 border border-border-lt gap-0.5">
            <button
              onClick={() => setTab('instructor')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === 'instructor' ? 'bg-forest text-white' : 'text-brown hover:bg-forest/5'
              }`}
            >
              <School className="w-4 h-4" /> For instructors
            </button>
            <button
              onClick={() => setTab('student')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === 'student' ? 'bg-forest text-white' : 'text-brown hover:bg-forest/5'
              }`}
            >
              <Book className="w-4 h-4" /> For students
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {steps.map((step, idx) => {
            const Comp = iconMap[step.icon] || Brain;
            return (
              <div key={idx} className="text-center relative">
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[60%] right-[-30%] h-[1.5px] bg-linear-to-r from-forest/60 to-border-lt" />
                )}
                <div className="w-10 h-10 rounded-full bg-forest flex items-center justify-center mx-auto mb-3 relative z-10 shadow-[0_0_0_5px_rgba(74,124,89,0.18)]">
                  <Comp className="w-4 h-4 text-white" />
                </div>
                <p className="font-medium text-sm text-dark">{step.t}</p>
                <p className="text-xs text-brown mt-1 leading-relaxed">{step.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}