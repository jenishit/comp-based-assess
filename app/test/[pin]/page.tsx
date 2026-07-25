"use client";
import { useState, useRef, useCallback, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Brain, ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";
import { useProctoringMonitor } from "@/hooks/useProctoringMonitor";
import { useAudioMonitor } from "@/hooks/useAudioMonitor";
import { useExamSecurity } from "@/hooks/useExamSecurity";
import { useKeystrokeDynamics } from "@/hooks/useKeystrokeDynamics";
import { attemptService } from "@/services/exam-service";
import type { ExamSession, Answer, Question } from "@/types/exam";
import { toast } from "sonner";
import ExamTimer from "../_components/ExamTimer";
import ProctorPanel from "../_components/ProctorPanel";
import QuestionNav from "../_components/QuestionNav";
import QuestionCard from "../_components/QuestionCard";

// ── page component ────────────────────────────────────────────────────
function ExamPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pin = params?.pin as string;
  const attemptId = searchParams?.get("attempt_id") ?? "";

  const [examMeta, setExamMeta] = useState<{
    exam_id: string; title: string; subject?: string; duration_minutes: number;
  } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startRef = useRef<Record<string, number>>({});

  // ── load the real exam + questions from the attempt_id ─────────────
  useEffect(() => {
    if (!attemptId) {
      router.replace("/instructor/join");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [exam, qs] = await Promise.all([
          attemptService.getExam(attemptId),
          attemptService.getQuestions(attemptId),
        ]);
        if (cancelled) return;
        setExamMeta(exam);
        setQuestions(
          [...qs]
            .sort((a, b) => a.order - b.order)
            .map((q) => ({
              id: q.question_id,
              type: q.type,
              text: q.text,
              options: q.options,
              marks: q.marks,
              bloomLevel: q.bloomLevel as Question["bloomLevel"],
            }))
        );
      } catch {
        if (!cancelled) {
          setLoadError("Could not load this exam. The link may be invalid or expired.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [attemptId, router]);

  const exam: ExamSession | null = useMemo(() => {
    if (!examMeta) return null;
    return {
      examId: examMeta.exam_id,
      pin,
      title: examMeta.title,
      subject: examMeta.subject ?? "",
      durationMinutes: examMeta.duration_minutes,
      questions,
      studentName: "",
      studentEmail: "",
    };
  }, [examMeta, questions, pin]);

  // start timing for current question
  useEffect(() => {
    const id = exam?.questions[currentIdx]?.id;
    if (id && !startRef.current[id]) startRef.current[id] = Date.now();
  }, [currentIdx, exam]);

  // ── proctoring ──────────────────────────────────────────────────────
  // Each hook persists its own events server-side (POST /attempts/{id}/proctoring-events);
  // no local event log is needed at this component level.
  const proctoringState = useProctoringMonitor(videoRef, {
    attemptId,
    enabled: !submitted && !loading,
  });

  const audioState = useAudioMonitor({
    attemptId,
    enabled: !submitted && !loading,
  });

  useKeystrokeDynamics({ attemptId, enabled: !submitted && !loading });

  // ── security (1-warning, 2nd-strike) ───────────────────────────────
  const { handleViolation } = useExamSecurity({
    attemptId,
    maxViolations: 2,
    onTerminated: (reason) => {
      router.push(`/test/blocked?reason=${encodeURIComponent(reason)}`);
    },
  });

  // ── fullscreen enforcement ──────────────────────────────────────────
  useEffect(() => {
    if (submitted || loading) return;

    document.documentElement.requestFullscreen?.().catch(() => {
      /* user or browser denied — nothing more we can do here */
    });

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !submitted) {
        handleViolation("fullscreen_exit");
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, loading]);

  // ── pointer lock enforcement ────────────────────────────────────────
  // Fragile by nature of the browser API — Escape exits fullscreen and
  // pointer lock together in most browsers, so this will often double-count
  // alongside the fullscreen check above. Acceptable for a first pass.
  const pointerLockIntentionalRef = useRef(false);

  useEffect(() => {
    if (submitted || loading) return;

    const requestLock = () => {
      if (document.fullscreenElement && !document.pointerLockElement) {
        document.body.requestPointerLock?.();
      }
    };
    document.addEventListener("click", requestLock);

    const handlePointerLockChange = () => {
      if (!document.pointerLockElement && !pointerLockIntentionalRef.current && !submitted) {
        handleViolation("pointer_lock_exit");
      }
      pointerLockIntentionalRef.current = false;
    };
    document.addEventListener("pointerlockchange", handlePointerLockChange);

    return () => {
      document.removeEventListener("click", requestLock);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      if (document.pointerLockElement) {
        pointerLockIntentionalRef.current = true;
        document.exitPointerLock();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, loading]);

  // ── answer persistence ───────────────────────────────────────────────
  const syncAnswer = useCallback(
    (questionId: string, value: string, flag: boolean, timeSpent: number) => {
      attemptService
        .submitAnswer(attemptId, {
          question_id: questionId,
          value,
          time_spent_seconds: timeSpent,
          flagged: flag,
        })
        .catch(() => {
          toast.error("Failed to save your answer — check your connection.");
        });
    },
    [attemptId],
  );

  // ── answer handling ─────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (value: string) => {
      const q = exam?.questions[currentIdx];
      if (!q) return;
      const now = Date.now();
      const timeSpent = Math.round(
        (now - (startRef.current[q.id] ?? now)) / 1000,
      );
      const isFlagged = flagged.has(currentIdx);
      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(q.id, {
          questionId: q.id,
          value,
          timeSpentSeconds: timeSpent,
          flagged: isFlagged,
        });
        return next;
      });
      syncAnswer(q.id, value, isFlagged, timeSpent);
    },
    [currentIdx, exam, flagged, syncAnswer],
  );

  const toggleFlag = useCallback(() => {
    const q = exam?.questions[currentIdx];
    const willBeFlagged = !flagged.has(currentIdx);

    setFlagged((prev) => {
      const next = new Set(prev);
      if (willBeFlagged) next.add(currentIdx);
      else next.delete(currentIdx);
      return next;
    });

    if (q) {
      const existing = answers.get(q.id);
      if (existing) {
        syncAnswer(q.id, existing.value, willBeFlagged, existing.timeSpentSeconds);
      }
    }
  }, [currentIdx, exam, flagged, answers, syncAnswer]);

  // ── submit ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    try {
      await attemptService.submitAttempt(attemptId);
      setSubmitted(true);
    } catch {
      toast.error("Failed to submit — please try again.");
    }
  }, [submitted, attemptId]);

  const answered = useMemo(() => new Set(
    Array.from(answers.entries())
      .filter(([, a]) => a.value.trim() !== "")
      .map(([id]) => exam?.questions.findIndex((q) => q.id === id) ?? -1)
      .filter((i) => i >= 0),
  ), [answers, exam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-espresso flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-sage mx-auto mb-3" aria-hidden="true" />
          <p className="text-[#B8AEA8] text-[15px]">Loading exam…</p>
        </div>
      </div>
    );
  }

  if (loadError || !exam) {
    return (
      <div className="min-h-screen bg-espresso flex items-center justify-center px-6">
        <p className="text-[#B8AEA8] text-[15px] text-center max-w-sm">
          {loadError ?? "Exam not found."}
        </p>
      </div>
    );
  }

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
          <p className="text-[#B8AEA8] text-[15px]">Your answers are being graded.</p>
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

export default function ExamPage() {
  return (
    <Suspense fallback={null}>
      <ExamPageContent />
    </Suspense>
  );
}
