"use client";
import { useRef, useCallback, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Send, Loader2, ArrowRight, ShieldAlert, Maximize2 } from "lucide-react";
import { useProctoringMonitor } from "@/hooks/useProctoringMonitor";
import { useAudioMonitor } from "@/hooks/useAudioMonitor";
import { useExamSecurity } from "@/hooks/useExamSecurity";
import { useKeystrokeDynamics } from "@/hooks/useKeystrokeDynamics";
import { useExamAttempt } from "@/hooks/useExamAttempt";
import { useProctoringEventBatcher } from "@/hooks/useProctoringEventBatcher";
import { useEnvironmentCheck } from "@/hooks/useEnvironmentCheck";
import { useObjectDetection } from "@/hooks/useObjectDetection";
import { useEvidenceCapturer } from "@/hooks/useEvidenceCapturer";
import { isSafeExamBrowser } from "@/lib/proctoring/environment-check";
import type { ProctoringEvent } from "@/types/proctoring-types";
import ExamHeader from "../_components/ExamHeader";
import ExamTimer from "../_components/ExamTimer";
import ExamNavFooter from "../_components/ExamNavFooter";
import ProctorPanel from "../_components/ProctorPanel";
import QuestionNav from "../_components/QuestionNav";
import QuestionCard from "../_components/QuestionCard";
import SecurityWarningModal from "../_components/SecurityWarningModal";
import DevToolsBlockedBanner from "../_components/DevToolsBlockedBanner";
import DeviceCheckStep, { type CalibratedAudioThresholds } from "../_components/DeviceCheckStep";

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

  // Browsers only grant requestFullscreen() from a synchronous user gesture
  // (a click) — a call made from a useEffect after the async exam-data fetch
  // resolves has no such gesture and is silently rejected. This gate's
  // button click is that gesture; see the render branch below.
  const [fullscreenEntered, setFullscreenEntered] = useState(false);

  // Camera/mic permission + noise calibration happens before the fullscreen
  // gate on purpose: if the mic prompt is still pending once fullscreen is
  // active, the permission popup itself can force the browser back out of
  // fullscreen — which useExamSecurity then reads as a fullscreen_exit
  // violation the student never actually committed. Resolving both prompts
  // here, before requestFullscreen() is ever called, means useProctoringMonitor
  // and useAudioMonitor's later getUserMedia calls just reuse the
  // already-granted permission with no new prompt.
  const [deviceCheckDone, setDeviceCheckDone] = useState(false);
  const [audioThresholds, setAudioThresholds] = useState<CalibratedAudioThresholds | null>(null);

  const {
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
  } = useExamAttempt({ attemptId, pin });

  // Belt-and-suspenders SEB gate: the backend already refuses a non-SEB join
  // for require_seb exams, but the attempt URL could be reopened outside SEB
  // afterwards. Short-circuit keeps isSafeExamBrowser() (which reads
  // navigator) off the SSR path — exam is null there, so requireSeb is false.
  const sebBlocked = (exam?.requireSeb ?? false) && !isSafeExamBrowser();

  // Monitors and the attempt itself must not start until the student has
  // clicked through the fullscreen gate below — camera/mic permission was
  // already granted during the device-check step above it, so this is an
  // explicit "begin" gesture before surveillance starts, not the point
  // permissions first fire.
  const active = !submitted && !loading && !sebBlocked && fullscreenEntered;

  // Telemetry from all monitors is buffered locally and flushed as one
  // batched request every 5s (only when something was actually collected)
  // instead of one POST per event — see lib/proctoring/event-batcher.ts.
  const enqueueProctoringEvent = useProctoringEventBatcher(attemptId);

  // Flagged-moment snapshots: evidence-worthy events (extra face, phone,
  // absence/return) additionally upload one webcam frame — never a stream.
  const maybeCaptureEvidence = useEvidenceCapturer(attemptId, videoRef);
  const onProctoringEvent = useCallback(
    (event: ProctoringEvent) => {
      enqueueProctoringEvent(event);
      maybeCaptureEvidence(event.type);
    },
    [enqueueProctoringEvent, maybeCaptureEvidence],
  );

  const proctoringState = useProctoringMonitor(videoRef, { attemptId, enabled: active, onEvent: onProctoringEvent });
  const audioState = useAudioMonitor({
    attemptId,
    enabled: active,
    onEvent: onProctoringEvent,
    ...(audioThresholds ?? {}),
  });
  useKeystrokeDynamics({ attemptId, enabled: active });
  useEnvironmentCheck({ enabled: active, onEvent: onProctoringEvent });
  useObjectDetection(videoRef, { enabled: active, onEvent: onProctoringEvent });

  // Identity churning here is fine — see the long comment above
  // handleViolationRef in useExamSecurity.ts: only the fullscreen/DOM-listener
  // effects (gated on [enabled, attemptId], reading handleViolationRef.current
  // at call time) need a stable identity, and this isn't one of them.
  //
  // Termination previously only logged a session_terminated proctoring
  // *event* and redirected — the attempt itself stayed IN_PROGRESS server
  // side forever, so refreshing (or just revisiting) /test/[pin] resumed
  // the live exam right past the "blocked" screen. handleSubmit() is the
  // same flush-answers-then-POST-/submit path a normal submission takes,
  // which flips attempt.status server-side and is what get_attempt_exam's
  // status field (checked in useExamAttempt below) then reflects on the
  // next load. Fire-and-forget: the redirect must not wait on the network.
  const onExamTerminated = useCallback(
    (reason: string) => {
      void handleSubmit();
      // replace, not push: a pushed entry leaves the live exam page one
      // Back tap away, which could resume it (briefly — with a stale mic/
      // camera stream still attached) before the fetch in useExamAttempt
      // below catches up and re-locks it. Replacing removes that page from
      // history entirely, so Back from /test/blocked goes to wherever the
      // student was before the exam, never back into it.
      router.replace(`/test/blocked?reason=${encodeURIComponent(reason)}`);
    },
    [router, handleSubmit],
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

  if (sebBlocked) {
    return (
      <div className="min-h-screen bg-espresso flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} className="text-red-400" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-medium text-white mb-2">Safe Exam Browser required</h2>
          <p className="text-[#9C96A8] text-[15px] leading-relaxed">
            This exam must be taken in Safe Exam Browser. Open the exam link inside SEB —
            an ordinary browser can’t be used for it.
          </p>
        </div>
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

  if (!deviceCheckDone) {
    return (
      <DeviceCheckStep
        onComplete={(thresholds) => {
          setAudioThresholds(thresholds);
          setDeviceCheckDone(true);
        }}
      />
    );
  }

  if (!fullscreenEntered) {
    return (
      <div className="min-h-screen bg-espresso flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-forest/20 flex items-center justify-center mx-auto mb-4">
            <Maximize2 size={28} className="text-sage" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-medium text-white mb-2">This exam requires fullscreen</h2>
          <p className="text-[#9C96A8] text-[15px] leading-relaxed mb-4">
            Click below to enter fullscreen and begin.
          </p>
          {/* Your exam clock started the moment you joined, not when you
              click through this screen — shown here so time spent reading
              this page is never invisible. */}
          <div className="flex flex-col items-center gap-1.5 mb-6">
            <p className="text-[11px] text-[#726C7E] uppercase tracking-wide">Time remaining</p>
            <ExamTimer
              durationMinutes={exam.durationMinutes}
              startedAt={exam.startedAt}
              onExpire={handleSubmit}
            />
          </div>
          <button
            onClick={() => {
              const result = document.documentElement.requestFullscreen?.();
              if (result) {
                result.catch(() => { /* user or browser denied — still let the exam begin */ });
              }
              setFullscreenEntered(true);
            }}
            className="px-6 py-3 rounded-xl bg-forest text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer border-0"
          >
            Enter fullscreen &amp; begin
          </button>
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
      <ExamHeader exam={exam} answeredCount={answered.size} onSubmit={handleSubmit} isSubmitting={isSubmitting} />

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
            isSubmitting={isSubmitting}
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
