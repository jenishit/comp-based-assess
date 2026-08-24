"use client";
import { useEffect, useRef } from "react";
import { embedFace, loadFaceModel } from "@/lib/proctoring/face-embedding";
import { attemptFaceVerificationService } from "@/services/exam-service";

interface UseFaceVerificationCaptureOptions {
  attemptId: string;
  /** Gate this alongside the exam being active — mirrors useProctoringMonitor/useExamSecurity's `enabled` convention. */
  enabled: boolean;
  /** True once useProctoringMonitor's camera stream has stabilized. */
  cameraReady: boolean;
  /** The same video element useProctoringMonitor is already streaming into — this hook must never open a second getUserMedia stream. */
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const STABILIZE_DELAY_MS = 3_000;
// Sparse on purpose: MediaPipe's FaceLandmarker already runs every frame via
// useProctoringMonitor's rAF loop for gaze/face-count. Human's embedding
// pipeline is a second, heavier WebGL model — running it this often (not
// every few seconds) keeps its cost from stacking on top of that continuous
// loop, while still being frequent enough to catch a mid-exam substitution
// within a reasonable window. Not a library-mandated value, a UX/cost call.
const RECHECK_INTERVAL_MS = 90_000;

/**
 * Captures a face embedding shortly after the exam camera comes online, then
 * repeats on RECHECK_INTERVAL_MS for the rest of the exam, and sends each
 * one for async, advisory comparison against the student's enrollment (see
 * backend app/workers/face_worker.py and app/api/attempts.py's inline
 * mismatch check). Fire-and-forget — never blocks the exam UI. A capture
 * that can't find exactly one face (no_face/multiple_faces) is skipped
 * silently — those cases are already separately covered by
 * useProctoringMonitor's face_absent/multiple_faces events.
 */
export function useFaceVerificationCapture({
  attemptId,
  enabled,
  cameraReady,
  videoRef,
}: UseFaceVerificationCaptureOptions): void {
  const capturingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !cameraReady) return;

    const capture = async (): Promise<void> => {
      if (capturingRef.current) return;
      capturingRef.current = true;
      try {
        const video = videoRef.current;
        if (!video) return;
        await loadFaceModel();
        const result = await embedFace(video);
        if (result.ok) {
          await attemptFaceVerificationService(attemptId, result.embedding);
        }
      } catch {
        /* fire-and-forget — never block the exam */
      } finally {
        capturingRef.current = false;
      }
    };

    const firstCapture = setTimeout(capture, STABILIZE_DELAY_MS);
    const recheckInterval = setInterval(capture, RECHECK_INTERVAL_MS);

    return () => {
      clearTimeout(firstCapture);
      clearInterval(recheckInterval);
    };
  }, [enabled, cameraReady, attemptId, videoRef]);
}
