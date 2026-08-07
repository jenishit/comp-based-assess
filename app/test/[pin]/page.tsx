"use client";
import { useRef, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Send, Loader2, ArrowRight } from "lucide-react";
import { useProctoringMonitor } from "@/hooks/useProctoringMonitor";
import { useAudioMonitor } from "@/hooks/useAudioMonitor";
import { useExamSecurity } from "@/hooks/useExamSecurity";
import { useKeystrokeDynamics } from "@/hooks/useKeystrokeDynamics";
import { useExamAttempt } from "@/hooks/useExamAttempt";
import { useProctoringEventBatcher } from "@/hooks/useProctoringEventBatcher";
import ExamHeader from "../_components/ExamHeader";
import ExamNavFooter from "../_components/ExamNavFooter";
import ProctorPanel from "../_components/ProctorPanel";
import QuestionNav from "../_components/QuestionNav";
import QuestionCard from "../_components/QuestionCard";
import SecurityWarningModal from "../_components/SecurityWarningModal";
import DevToolsBlockedBanner from "../_components/DevToolsBlockedBanner";

// Renders nothing — isolates useFaceVerificationCapture's @vladmandic/human
// import chain from SSR (its Node.js build needs @tensorflow/tfjs-node,
// which isn't installed; this pipeline is browser-only by design).
const FaceVerificationCapture = dynamic(() => import("../_components/FaceVerificationCapture"), {
  ssr: false,
});

function ExamPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: sessionStatus } = useSession();
  const pin = params?.pin as string;
  const attemptId = searchParams?.get("attempt_id") ?? "";

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    exam,
    loading,
    loadError,
    currentIdx,
    setCurrentIdx,
    answers,
    flagged,
    submitted,
    answered,
    handleAnswer,
    toggleFlag,
    handleSubmit,
  } = useExamAttempt({ attemptId, pin });

  const active = !submitted && !loading;

  // Telemetry from both monitors is buffered locally and flushed as one
  // batched request every 5s (only when something was actually collected)
  // instead of one POST per event — see lib/proctoring/event-batcher.ts.
  const enqueueProctoringEvent = useProctoringEventBatcher(attemptId);
  const proctoringState = useProctoringMonitor(videoRef, { attemptId, enabled: active, onEvent: enqueueProctoringEvent });
  const audioState = useAudioMonitor({ attemptId, enabled: active, onEvent: enqueueProctoringEvent });
  useKeystrokeDynamics({ attemptId, enabled: active });

  // Stable identity — see the long comment above handleViolationRef in
  // useExamSecurity.ts for why an inline arrow function here previously
  // caused the fullscreen enforcement effect to tear down and re-run (exit
  // + re-enter real browser fullscreen) on every re-render of this page.
  const onExamTerminated = useCallback(
    (reason: string) => {
      router.push(`/test/blocked?reason=${encodeURIComponent(reason)}`);
    },
    [router],
  );

  // 1-warning, 2nd-strike rule; also owns fullscreen/pointer-lock enforcement.
  const { warning, dismissWarning, devToolsBlocking, resumeFromDevTools } = useExamSecurity({
    attemptId,
    maxViolations: 3,
    enabled: active,
    onTerminated: onExamTerminated,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-espresso flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-sage mx-auto mb-3" aria-hidden="true" />
          <p className="text-[#9C96A8] text-[15px]">Loading exam…</p>
        </div>
      </div>
    );
  }

  if (loadError || !exam) {
    return (
      <div className="min-h-screen bg-espresso flex items-center justify-center px-6">
        <p className="text-[#9C96A8] text-[15px] text-center max-w-sm">
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
          <h2 className="text-2xl font-medium text-white mb-2">Exam submitted!</h2>
          <p className="text-[#9C96A8] text-[15px]">Your answers are being graded.</p>
          {sessionStatus === "authenticated" && attemptId && (
            <Link
              href={`/student/attempts/${attemptId}`}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:opacity-90 transition-opacity no-underline"
            >
              View detailed results <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  const q = exam.questions[currentIdx];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-cream">
      {/* One-time, advisory face-verification snapshot off the same camera
          stream useProctoringMonitor already opened — see
          app/workers/face_worker.py. Renders nothing. */}
      <FaceVerificationCapture
        attemptId={attemptId}
        enabled={active}
        cameraReady={proctoringState.cameraReady}
        videoRef={videoRef}
      />
      {devToolsBlocking ? (
        <DevToolsBlockedBanner onResume={resumeFromDevTools} />
      ) : (
        warning && <SecurityWarningModal warning={warning} onDismiss={dismissWarning} />
      )}
      <ExamHeader exam={exam} answeredCount={answered.size} onSubmit={handleSubmit} />

      <div className="flex flex-1 min-h-0">
        <aside className="w-67 shrink-0 bg-sand-light border-r border-sand-border overflow-y-auto flex flex-col gap-5 p-4">
          <ProctorPanel proctoringState={proctoringState} audioState={audioState} videoRef={videoRef} />
          <hr className="border-sand-border" />
          <QuestionNav
            total={exam.questions.length}
            current={currentIdx}
            answered={answered}
            flagged={flagged}
            onSelect={setCurrentIdx}
          />
        </aside>

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

          <ExamNavFooter
            currentIdx={currentIdx}
            total={exam.questions.length}
            onPrev={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            onNext={() => setCurrentIdx((i) => Math.min(exam.questions.length - 1, i + 1))}
            onSubmit={handleSubmit}
          />
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
