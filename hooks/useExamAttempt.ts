import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { attemptExamGetService, attemptQuestionsGetService, attemptAnswerSubmitService, attemptSubmitService } from "@/services/exam-service";
import type { ExamSession, Answer, Question } from "@/types/exam-types";
import { toast } from "sonner";

interface UseExamAttemptOptions {
  attemptId: string;
  pin: string;
}

export function useExamAttempt({ attemptId, pin }: UseExamAttemptOptions) {
  const router = useRouter();

  const [examMeta, setExamMeta] = useState<{
    exam_id: string; title: string; subject?: string; duration_minutes: number; require_seb?: boolean; started_at?: string;
  } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!attemptId) {
      router.replace("/student/join");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [exam, qs] = await Promise.all([
          attemptExamGetService(attemptId),
          attemptQuestionsGetService(attemptId),
        ]);
        if (cancelled) return;
        setExamMeta(exam);
        // Ground truth from the server, not local component state — this is
        // what actually stops a revisited/refreshed attempt (submitted
        // normally, on timeout, or on a proctoring termination) from
        // resuming as if it were still live. See AttemptExam.status.
        //
        // The toast only fires on this path (a fresh load discovering an
        // already-finalized attempt), never right after a live student
        // clicks Submit themselves — that flow sets `submitted` locally
        // without a refetch, so it never hits this branch.
        if (exam.status !== "in_progress") {
          setSubmitted(true);
          toast.info("You've already attempted this exam.");
        }
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
            })),
        );
      } catch {
        if (!cancelled) setLoadError("Could not load this exam. The link may be invalid or expired.");
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
      requireSeb: examMeta.require_seb ?? false,
      startedAt: examMeta.started_at,
    };
  }, [examMeta, questions, pin]);

  useEffect(() => {
    const id = exam?.questions[currentIdx]?.id;
    if (id && !startRef.current[id]) startRef.current[id] = Date.now();
  }, [currentIdx, exam]);

  // Debounced per-question: a short-answer textarea fires this on every
  // keystroke, and firing a save request per keystroke was flooding the
  // (remote, occasionally slow) backend and failing almost every time.
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const submitAnswerNow = useCallback(
    (questionId: string, value: string, flag: boolean, timeSpent: number) => {
      return attemptAnswerSubmitService(attemptId, {
        question_id: questionId,
        value,
        time_spent_seconds: timeSpent,
        flagged: flag,
      }).catch(() => {
        toast.error("Failed to save your answer — check your connection.");
      });
    },
    [attemptId],
  );

  const syncAnswer = useCallback(
    (questionId: string, value: string, flag: boolean, timeSpent: number, immediate = false) => {
      const existing = debounceTimers.current.get(questionId);
      if (existing) clearTimeout(existing);

      if (immediate) {
        debounceTimers.current.delete(questionId);
        submitAnswerNow(questionId, value, flag, timeSpent);
        return;
      }

      debounceTimers.current.set(
        questionId,
        setTimeout(() => {
          debounceTimers.current.delete(questionId);
          submitAnswerNow(questionId, value, flag, timeSpent);
        }, 600),
      );
    },
    [submitAnswerNow],
  );

  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const handleAnswer = useCallback(
    (value: string) => {
      const q = exam?.questions[currentIdx];
      if (!q) return;
      const now = Date.now();
      const timeSpent = Math.round((now - (startRef.current[q.id] ?? now)) / 1000);
      const isFlagged = flagged.has(currentIdx);
      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(q.id, { questionId: q.id, value, timeSpentSeconds: timeSpent, flagged: isFlagged });
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
        syncAnswer(q.id, existing.value, willBeFlagged, existing.timeSpentSeconds, true);
      }
    }
  }, [currentIdx, exam, flagged, answers, syncAnswer]);

  // Guards against two overlapping calls (a double-click on Submit — it has
  // no disabled-while-submitting state — or ExamTimer's onExpire firing at
  // the same moment a student manually clicks Submit). `submitted` alone
  // isn't enough: it only flips after the first call's await resolves, so a
  // second call landing before that still reads it as false and fires its
  // own POST /submit, which the server correctly 400s as already-submitted
  // — that 400 was being shown to the student as "Failed to submit".
  const submittingRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (submitted || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      // Flush any answers still sitting in a debounce window so the last
      // few keystrokes aren't lost if the student submits right after typing.
      debounceTimers.current.forEach((t) => clearTimeout(t));
      debounceTimers.current.clear();

      if (answers.size > 0) {
        await attemptAnswerSubmitService(
          attemptId,
          Array.from(answers.values()).map((a) => ({
            question_id: a.questionId,
            value: a.value,
            time_spent_seconds: a.timeSpentSeconds,
            flagged: a.flagged,
          })),
        );
      }

      await attemptSubmitService(attemptId);
      setSubmitted(true);
    } catch (err) {
      // The only 400 submit_attempt returns is "Attempt already submitted"
      // — i.e. a concurrent call (or termination's own handleSubmit call,
      // see onExamTerminated in the exam page) already succeeded. That's
      // this attempt being done, not a failure to submit.
      if (isAxiosError(err) && err.response?.status === 400) {
        setSubmitted(true);
      } else {
        toast.error("Failed to submit — please try again.");
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [submitted, attemptId, answers]);

  const answered = useMemo(() => new Set(
    Array.from(answers.entries())
      .filter(([, a]) => a.value.trim() !== "")
      .map(([id]) => exam?.questions.findIndex((q) => q.id === id) ?? -1)
      .filter((i) => i >= 0),
  ), [answers, exam]);

  return {
    exam,
    loading,
    loadError,
    currentIdx,
    setCurrentIdx,
    answers,
    flagged,
    submitted,
    isSubmitting,
    answered,
    handleAnswer,
    toggleFlag,
    handleSubmit,
  };
}
