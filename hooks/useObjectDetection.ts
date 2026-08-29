"use client";
import { useEffect, useRef, useState } from "react";
import { FilesetResolver, ObjectDetector } from "@mediapipe/tasks-vision";
import type { ProctoringEvent, ProctoringEventType } from "@/types/proctoring-types";
import { createEventThrottle } from "@/lib/proctoring/create-event-throttle";

// Same CDN pattern as useProctoringMonitor's FaceLandmarker — the JS API is
// bundled from npm, the WASM + model assets are fetched at runtime.
const WASM_BASE_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";

// EfficientDet-Lite0 is trained on COCO — these are the COCO labels that
// matter in an exam context, mapped to the event they raise.
const CONTRABAND_EVENTS: Record<string, ProctoringEventType> = {
  "cell phone": "phone_detected",
  book: "book_detected",
};
const EVENT_THROTTLE_MS: Record<string, number> = {
  phone_detected: 15_000,
  book_detected: 20_000,
};

// Face detection needs per-frame latency; object detection doesn't — a phone
// on a desk is still there 2.5s later. The sparse interval keeps this
// pipeline's cost a rounding error next to the landmarker's rAF loop.
const DETECT_INTERVAL_MS = 2_500;
const MIN_SCORE = 0.45;

export interface ObjectDetectionState {
  phoneVisible: boolean;
  bookVisible: boolean;
  modelReady: boolean;
}

interface UseObjectDetectionOptions {
  enabled: boolean;
  /** Wire to the shared event batcher, same as the other monitor hooks. */
  onEvent: (event: ProctoringEvent) => void;
}

/**
 * Sparse contraband scan (phones, books) over the webcam stream that
 * useProctoringMonitor already opened — reuses the same <video>, opens no
 * second camera stream.
 */
export function useObjectDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  { enabled, onEvent }: UseObjectDetectionOptions,
): ObjectDetectionState {
  const [state, setState] = useState<ObjectDetectionState>({
    phoneVisible: false,
    bookVisible: false,
    modelReady: false,
  });
  const detectorRef = useRef<ObjectDetector | null>(null);
  const canFireRef = useRef(createEventThrottle<ProctoringEventType>());
  const lastTimestampRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE_PATH);
        const optionsFor = (delegate: "GPU" | "CPU") => ({
          baseOptions: { modelAssetPath: MODEL_ASSET_PATH, delegate },
          runningMode: "VIDEO" as const,
          scoreThreshold: MIN_SCORE,
          maxResults: 5,
        });
        let detector;
        try {
          detector = await ObjectDetector.createFromOptions(vision, optionsFor("GPU"));
        } catch {
          // No usable WebGL context — same CPU-delegate fallback as
          // useProctoringMonitor's FaceLandmarker.
          detector = await ObjectDetector.createFromOptions(vision, optionsFor("CPU"));
        }
        if (cancelled) {
          detector.close();
          return;
        }
        detectorRef.current = detector;
        setState((s) => ({ ...s, modelReady: true }));

        intervalId = setInterval(() => {
          const video = videoRef.current;
          if (
            !video ||
            video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
            video.paused ||
            video.ended
          ) {
            return;
          }
          // VIDEO running mode requires strictly increasing timestamps.
          const now = performance.now();
          if (now <= lastTimestampRef.current) return;
          lastTimestampRef.current = now;

          let detections;
          try {
            detections = detector.detectForVideo(video, now).detections;
          } catch {
            return; // transient — next tick retries
          }

          const seen = new Map<ProctoringEventType, number>();
          for (const detection of detections) {
            const top = detection.categories[0];
            const eventType = top ? CONTRABAND_EVENTS[top.categoryName] : undefined;
            if (eventType && top.score >= MIN_SCORE) {
              seen.set(eventType, Math.max(seen.get(eventType) ?? 0, top.score));
            }
          }

          setState((s) => ({
            ...s,
            phoneVisible: seen.has("phone_detected"),
            bookVisible: seen.has("book_detected"),
          }));

          for (const [eventType, score] of seen) {
            if (canFireRef.current(eventType, EVENT_THROTTLE_MS[eventType] ?? 15_000)) {
              onEvent({
                type: eventType,
                timestamp: Date.now(),
                metadata: { confidence: Math.round(score * 100) / 100 },
              });
            }
          }
        }, DETECT_INTERVAL_MS);
      } catch {
        // Model failed to load (offline, CDN blocked) — object detection is
        // an enhancement on top of the core face pipeline, never fatal.
      }
    })();

    return () => {
      cancelled = true;
      if (intervalId !== null) clearInterval(intervalId);
      detectorRef.current?.close();
      detectorRef.current = null;
    };
    // onEvent is identity-stable (useProctoringEventBatcher's useCallback).
  }, [enabled, onEvent, videoRef]);

  return state;
}
