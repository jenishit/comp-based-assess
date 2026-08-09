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

/**
 * Captures one face embedding shortly after the exam camera comes online and
 * sends it for async, advisory comparison against the student's enrollment
 * (see backend app/workers/face_worker.py). Fire-and-forget — never blocks
 * the exam UI and never re-checks after the first successful capture.
 */
export function useFaceVerificationCapture({
  attemptId,
  enabled,
  cameraReady,
  videoRef,
}: UseFaceVerificationCaptureOptions): void {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !cameraReady || firedRef.current) return;
    firedRef.current = true;

    const timer = setTimeout(async () => {
      const video = videoRef.current;
      if (!video) return;
      try {
        await loadFaceModel();
        const result = await embedFace(video);
        if (result.ok) {
          await attemptFaceVerificationService(attemptId, result.embedding);
        }
      } catch {
        /* fire-and-forget — never block the exam */
      }
    }, STABILIZE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [enabled, cameraReady, attemptId, videoRef]);
}
