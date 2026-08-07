"use client";
import { useCallback, useEffect, useRef } from "react";
import { createEvidenceCapturer, type EvidenceCapturer } from "@/lib/proctoring/evidence-capture";
import type { ProctoringEventType } from "@/types/proctoring-types";

/**
 * Owns one evidence capturer for an attempt and returns a stable
 * `maybeCapture(eventType)` callback. Grabbing a webcam frame reads
 * videoRef.current, so this is kept out of render (in an effect/ref) rather
 * than constructed inline.
 */
export function useEvidenceCapturer(
  attemptId: string,
  videoRef: React.RefObject<HTMLVideoElement | null>,
): (eventType: ProctoringEventType) => void {
  const capturerRef = useRef<EvidenceCapturer | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    capturerRef.current = createEvidenceCapturer(attemptId, videoRef);
    return () => {
      capturerRef.current = null;
    };
  }, [attemptId, videoRef]);

  return useCallback((eventType: ProctoringEventType) => {
    capturerRef.current?.maybeCapture(eventType);
  }, []);
}
