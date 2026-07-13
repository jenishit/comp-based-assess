"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Brain, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useProctoringMonitor } from "@/hooks/useProctoringMonitor";
import { useAudioMonitor } from "@/hooks/useAudioMonitor";
import type { ExamSession, Answer, ProctoringEvent } from "@/types/exam";
import ExamTimer from "../_components/ExamTimer";
import ProctorPanel from "../_components/ProctorPanel";
import QuestionNav from "../_components/QuestionNav";
import QuestionCard from "../_components/QuestionCard";

// ── sample data (replace with real API fetch) ─────────────────────────
const SAMPLE_EXAM: ExamSession = {
  examId: "exam-001",
  pin: "482619",
  title: "Introduction to Machine Learning",
  subject: "Computer Science",
  durationMinutes: 45,
  studentName: "Student",
  studentEmail: "",
  questions: [
    {
      id: "q1",
      type: "mcq",
      marks: 2,
      bloomLevel: "understand",
      text: "A hospital's diagnostic model achieves 94% accuracy on test data but only 61% accuracy in deployment. Given that the training set has severe class imbalance, which strategy is most likely to resolve this gap?",
      options: [
        "Increase the total training data volume uniformly",
        "Apply SMOTE oversampling to the minority class",
        "Reduce the model's learning rate during fine-tuning",
        "Replace the accuracy metric with recall in the loss function",
      ],
    },
    {
      id: "q2",
      type: "mcq",
      marks: 2,
      bloomLevel: "analyze",
      text: "In a transformer-based language model, which component is primarily responsible for allowing the model to weigh the relevance of different input tokens relative to each other?",
      options: [
        "Feed-forward network",
        "Layer normalisation",
        "Self-attention mechanism",
        "Positional encoding",
      ],
    },
    {
      id: "q3",
      type: "short_answer",
      marks: 5,
      bloomLevel: "evaluate",
      text: "A company deploys a recommendation system trained on pre-pandemic user behaviour. After two years, the model's performance degrades significantly. Explain the likely cause of this degradation and propose two concrete approaches to address it, justifying each choice.",
    },
    {
      id: "q4",
      type: "mcq",
      marks: 2,
      bloomLevel: "apply",
      text: "During gradient descent on a non-convex loss surface, a model consistently converges to the same suboptimal local minimum regardless of the number of training epochs. Which modification is most likely to help escape this local minimum?",
      options: [
        "Decreasing the batch size to 1 (SGD)",
        "Adding L2 regularisation to the loss",
        "Using a cyclic learning rate schedule",
        "Increasing the number of hidden layers",
      ],
    },
    {
      id: "q5",
      type: "short_answer",
      marks: 6,
      bloomLevel: "create",
      text: "You are designing an anomaly detection system for a manufacturing pipeline where defective products occur less than 0.3% of the time. Describe the complete modelling pipeline you would build, including the choice of algorithm, how you would handle class imbalance, which evaluation metrics you would prioritise and why, and how you would deploy the system with monitoring in place.",
    },
  ],
};

// ── page component ────────────────────────────────────────────────────
export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const pin = params?.pin as string;

  const [exam] = useState<ExamSession>(SAMPLE_EXAM);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startRef = useRef<Record<string, number>>({});

  // start timing for current question
  useEffect(() => {
    const id = exam.questions[currentIdx]?.id;
    if (id && !startRef.current[id]) startRef.current[id] = Date.now();
  }, [currentIdx, exam.questions]);

  // ── proctoring ──────────────────────────────────────────────────────
  const handleEvent = useCallback((ev: ProctoringEvent) => {
    setEvents((prev) => [ev, ...prev.slice(0, 49)]);
  }, []);

  const proctoringState = useProctoringMonitor(videoRef, {
    examId: exam.examId,
    enabled: !submitted,
    onEvent: handleEvent,
  });

  const audioState = useAudioMonitor({
    enabled: !submitted,
    onEvent: handleEvent,
  });

  // ── answer handling ─────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (value: string) => {
      const q = exam.questions[currentIdx];
      const now = Date.now();
      const timeSpent = Math.round(
        (now - (startRef.current[q.id] ?? now)) / 1000,
      );
      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(q.id, {
          questionId: q.id,
          value,
          timeSpentSeconds: timeSpent,
          flagged: false,
        });
        return next;
      });
    },
    [currentIdx, exam.questions],
  );

  const toggleFlag = useCallback(() => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(currentIdx) ? next.delete(currentIdx) : next.add(currentIdx);
      return next;
    });
  }, [currentIdx]);

  // ── submit ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    const payload = {
      examId: exam.examId,
      answers: Array.from(answers.values()),
      events: events,
    };
    await fetch("/api/exam/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
    router.push(`/exam/${pin}/results`);
  }, [submitted, exam.examId, answers, events, router, pin]);

  const answered = new Set(
    Array.from(answers.entries())
      .filter(([, a]) => a.value.trim() !== "")
      .map(([id]) => exam.questions.findIndex((q) => q.id === id)),
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-espresso flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-forest/20 flex items-center justify-center mx-auto mb-4">
            <Send size={28} className="text-sage" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-medium text-white mb-2">
            Exam submitted!
          </h2>
          <p className="text-[#B8AEA8] text-[15px]">Redirecting to results…</p>
        </div>
      </div>
    );
  }

  const q = exam.questions[currentIdx];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-cream">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header
        className="bg-espresso px-6 py-3 flex items-center gap-4 shrink-0
                         border-b border-[#3A2518]"
      >
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-[7px] bg-forest flex items-center justify-center">
            <Brain size={15} color="#fff" aria-hidden="true" />
          </div>
          <span className="font-medium text-[15px] text-white">EduQuest</span>
        </div>

        <div className="h-5 w-px bg-[#4A3A2A]" />

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-white truncate m-0">
            {exam.title}
          </p>
          <p className="text-[11px] text-[#9A8A7A] m-0">{exam.subject}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#9A8A7A]">
            {answered.size} / {exam.questions.length} answered
          </span>
          <ExamTimer
            durationMinutes={exam.durationMinutes}
            onExpire={handleSubmit}
          />
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest
                       text-white text-[13px] font-medium border-0 cursor-pointer
                       hover:bg-forest-dark transition-colors"
          >
            <Send size={14} aria-hidden="true" />
            Submit
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left panel: proctoring + nav ──────────────────────────── */}
        <aside
          className="w-67 shrink-0 bg-sand-light border-r border-sand-border
                           overflow-y-auto flex flex-col gap-5 p-4"
        >
          <ProctorPanel
            proctoringState={proctoringState}
            audioState={audioState}
            videoRef={videoRef}
          />
          <hr className="border-sand-border" />
          <QuestionNav
            total={exam.questions.length}
            current={currentIdx}
            answered={answered}
            flagged={flagged}
            onSelect={setCurrentIdx}
          />
        </aside>

        {/* ── Main: question area ───────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
            <QuestionCard
              question={q}
              index={currentIdx}
              total={exam.questions.length}
              answer={answers.get(q.id)}
              flagged={flagged.has(currentIdx)}
              onAnswer={handleAnswer}
              onToggleFlag={toggleFlag}
            />
          </div>

          {/* Nav buttons */}
          <div
            className="border-t border-sand-border bg-white px-8 py-4 flex
                           justify-between items-center shrink-0"
          >
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                         border border-sand-border bg-white text-[14px] font-medium
                         text-bark hover:bg-sand-light transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <span className="text-[13px] text-bark">
              {currentIdx + 1} of {exam.questions.length}
            </span>

            {currentIdx < exam.questions.length - 1 ? (
              <button
                onClick={() =>
                  setCurrentIdx((i) =>
                    Math.min(exam.questions.length - 1, i + 1),
                  )
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           border-0 bg-forest text-white text-[14px] font-medium
                           hover:bg-forest-dark transition-colors cursor-pointer"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           border-0 bg-forest text-white text-[14px] font-medium
                           hover:bg-forest-dark transition-colors cursor-pointer"
              >
                Submit exam <Send size={14} />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
