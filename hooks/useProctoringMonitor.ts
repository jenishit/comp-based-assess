"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { FaceLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { ProctoringEvent, ProctoringEventType, ProctoringState } from "@/types/proctoring-types";
import { createEventThrottle } from "@/lib/proctoring/create-event-throttle";

type GazeDirection = ProctoringState["gazeDirection"];

// The face_landmarker model bundle emits 478 landmarks (0-477), same layout
// FaceMesh's refineLandmarks=true produced — indices below are unchanged.
const IDX = {
  R_IRIS: 468,
  L_IRIS: 473,
  R_OUTER: 33,
  R_INNER: 133,
  L_OUTER: 263,
  L_INNER: 362,
  R_TOP: 159,
  R_BOTTOM: 145,
};

// The JS API ships via npm; the WASM binary + model asset are still fetched
// from a CDN at runtime (not bundled) — this is normal for tasks-vision.
const WASM_BASE_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const INITIAL_STATE: ProctoringState = {
  cameraReady: false,
  faceCount: 0,
  gazeAway: false,
  gazeDirection: "center",
  voiceDetected: false,
  multipleSpeakers: false,
  pasteCount: 0,
  tabSwitches: 0,
  windowBlurs: 0,
  typingActive: false,
  error: null,
};

interface UseProctoringOptions {
  attemptId: string;
  enabled?: boolean;
  /** Sink for every proctoring event this hook produces — wire this to the
   * shared event batcher (see useProctoringEventBatcher) rather than posting
   * per-event. */
  onEvent: (event: ProctoringEvent) => void;
}

export function useProctoringMonitor(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseProctoringOptions,
): ProctoringState {
  const { enabled = true, onEvent } = options;

  const [state, setState] = useState<ProctoringState>(INITIAL_STATE);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const canFireRef = useRef(createEventThrottle<ProctoringEventType>());
  const faceAbsentSinceRef = useRef<number | null>(null);
  const gazeAwaySinceRef = useRef<number | null>(null);
  const pasteCountRef = useRef(0);
  const tabSwitchCountRef = useRef(0);
  const windowBlurCountRef = useRef(0);
  const typingActiveRef = useRef(false);
  const lastKeystrokeRef = useRef(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Holds the latest `processFrame` so the rAF loop below can call it
  // recursively without referencing the `useCallback`-bound identifier from
  // within its own body.
  const processFrameRef = useRef<() => void>(() => {});

  const patchState = useCallback((patch: Partial<ProctoringState>): void => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const reportEvent = useCallback(
    (event: Omit<ProctoringEvent, "timestamp">): void => {
      onEvent({ ...event, timestamp: Date.now() });
    },
    [onEvent],
  );

  // hRatio: 0 -> iris fully toward right temple; 1 -> fully toward nose (centre ~0.50)
  // vRatio: 0 -> iris at top of eye; 1 -> iris at bottom (centre ~0.50)
  const estimateGaze = useCallback(
    (landmarks: NormalizedLandmark[]): { direction: GazeDirection; away: boolean; yaw: number; pitch: number } => {
      const fallback = { direction: "center" as GazeDirection, away: false, yaw: 0.5, pitch: 0.5 };
      if (landmarks.length < 478) return fallback;

      const get = (i: number): NormalizedLandmark => landmarks[i];

      const eyeWR = Math.abs(get(IDX.R_INNER).x - get(IDX.R_OUTER).x);
      const eyeWL = Math.abs(get(IDX.L_INNER).x - get(IDX.L_OUTER).x);
      if (eyeWR < 0.001 || eyeWL < 0.001) return fallback;

      const rH = (get(IDX.R_IRIS).x - get(IDX.R_OUTER).x) / (get(IDX.R_INNER).x - get(IDX.R_OUTER).x);
      const lH = (get(IDX.L_IRIS).x - get(IDX.L_OUTER).x) / (get(IDX.L_INNER).x - get(IDX.L_OUTER).x);
      const hRatio = (rH + lH) / 2;

      const eyeH = Math.abs(get(IDX.R_BOTTOM).y - get(IDX.R_TOP).y);
      const vRatio = eyeH > 0.001 ? (get(IDX.R_IRIS).y - get(IDX.R_TOP).y) / eyeH : 0.5;

      let direction: GazeDirection = "center";
      if (hRatio < 0.28) direction = "right";
      else if (hRatio > 0.72) direction = "left";
      else if (vRatio < 0.25) direction = "up";
      else if (vRatio > 0.80) direction = "down";

      return { direction, away: direction !== "center", yaw: hRatio, pitch: vRatio };
    },
    [],
  );

  const processResults = useCallback(
    (results: FaceLandmarkerResult): void => {
      const faces = results.faceLandmarks;
      const count = faces.length;
      const now = Date.now();
      const canFire = canFireRef.current;

      patchState({ faceCount: count });

      if (count === 0) {
        if (faceAbsentSinceRef.current === null) faceAbsentSinceRef.current = now;
        const goneMs = now - faceAbsentSinceRef.current;
        if (goneMs > 5_000 && canFire("face_absent", 10_000)) {
          reportEvent({ type: "face_absent", duration: goneMs, metadata: { secondsGone: Math.round(goneMs / 1_000) } });
        }
      } else {
        // A reappearance after a real absence is itself a flagged moment —
        // it's the frame most likely to show *who* sat back down.
        if (faceAbsentSinceRef.current !== null && now - faceAbsentSinceRef.current > 5_000 && canFire("face_returned", 10_000)) {
          reportEvent({ type: "face_returned", metadata: { secondsGone: Math.round((now - faceAbsentSinceRef.current) / 1_000) } });
        }
        faceAbsentSinceRef.current = null;
      }

      if (count > 1 && canFire("multiple_faces", 8_000)) {
        reportEvent({ type: "multiple_faces", metadata: { count } });
      }

      if (count > 0) {
        const { direction, away, yaw, pitch } = estimateGaze(faces[0]);
        patchState({ gazeDirection: direction, gazeAway: away });

        // Continuous, unconditional sample for the gaze plot's timeline —
        // independent of the away/violation thresholds below.
        if (canFire("gaze_sample", 2_000)) {
          reportEvent({ type: "gaze_sample", metadata: { direction, yaw, pitch } });
        }

        if (away) {
          if (gazeAwaySinceRef.current === null) gazeAwaySinceRef.current = now;
          const awayMs = now - gazeAwaySinceRef.current;
          if (awayMs > 4_000 && canFire("gaze_away", 8_000)) {
            reportEvent({
              type: "gaze_away",
              duration: awayMs,
              metadata: { direction, secondsAway: Math.round(awayMs / 1_000), yaw, pitch },
            });
          }
        } else {
          if (gazeAwaySinceRef.current !== null && canFire("gaze_returned", 3_000)) {
            reportEvent({ type: "gaze_returned", metadata: { yaw, pitch } });
          }
          gazeAwaySinceRef.current = null;
        }
      }
    },
    [patchState, reportEvent, estimateGaze],
  );

  const initFaceLandmarker = useCallback(async (): Promise<void> => {
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE_PATH);
    faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_ASSET_PATH, delegate: "GPU" },
      runningMode: "VIDEO",
      numFaces: 3,
      minFaceDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }, []);

  // detectForVideo requires a strictly increasing timestamp on each call to
  // the same landmarker instance (VIDEO running mode) — a non-advancing or
  // out-of-order tick (e.g. during React StrictMode's dev-only double-invoke
  // of the mount effect below, or a rAF callback still in flight right as
  // the instance is torn down) throws and would otherwise crash the loop.
  const lastDetectTimestampRef = useRef(0);

  // detectForVideo is synchronous — no async queue-overflow guard needed
  // (unlike the old FaceMesh .send()/onResults callback API).
  const processFrame = useCallback((): void => {
    const video = videoRef.current;
    const landmarker = faceLandmarkerRef.current;

    if (
      video !== null &&
      landmarker !== null &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      !video.paused &&
      !video.ended
    ) {
      const now = performance.now();
      if (now > lastDetectTimestampRef.current) {
        lastDetectTimestampRef.current = now;
        try {
          processResults(landmarker.detectForVideo(video, now));
        } catch (err) {
          console.error("[useProctoringMonitor] detectForVideo failed:", err);
        }
      }
    }

    rafRef.current = requestAnimationFrame(() => processFrameRef.current());
  }, [videoRef, processResults]);

  useEffect(() => {
    processFrameRef.current = processFrame;
  }, [processFrame]);

  const startCamera = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => { /* autoplay blocked — user will see static */ });
      }
      patchState({ cameraReady: true, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Camera access denied";
      patchState({ error: message });
    }
  }, [videoRef, patchState]);

  useEffect(() => {
    if (!enabled) return;
    const canFire = canFireRef.current;

    const onPaste = (e: ClipboardEvent): void => {
      pasteCountRef.current += 1;
      const charCount = e.clipboardData?.getData("text").length ?? 0;
      patchState({ pasteCount: pasteCountRef.current });
      reportEvent({ type: "paste_event", metadata: { count: pasteCountRef.current, charCount } });
    };

    const onVisibilityChange = (): void => {
      if (!document.hidden) return;
      tabSwitchCountRef.current += 1;
      patchState({ tabSwitches: tabSwitchCountRef.current });
      if (canFire("tab_switch", 2_000)) {
        reportEvent({ type: "tab_switch", metadata: { count: tabSwitchCountRef.current } });
      }
    };

    const onWindowBlur = (): void => {
      windowBlurCountRef.current += 1;
      patchState({ windowBlurs: windowBlurCountRef.current });
      if (canFire("window_blur", 2_000)) {
        reportEvent({ type: "window_blur", metadata: { count: windowBlurCountRef.current } });
      }
    };

    const onKeyDown = (): void => {
      lastKeystrokeRef.current = Date.now();

      if (!typingActiveRef.current) {
        typingActiveRef.current = true;
        patchState({ typingActive: true });
        reportEvent({ type: "typing_resumed" });
      }

      if (typingTimerRef.current !== null) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        typingActiveRef.current = false;
        patchState({ typingActive: false });
        reportEvent({ type: "typing_stopped", metadata: { idleMs: Date.now() - lastKeystrokeRef.current } });
      }, 15_000);
    };

    document.addEventListener("paste", onPaste);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("keydown", onKeyDown);
      if (typingTimerRef.current !== null) clearTimeout(typingTimerRef.current);
    };
  }, [enabled, patchState, reportEvent]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        await initFaceLandmarker();
        if (cancelled) return;
        await startCamera();
        if (cancelled) return;
        rafRef.current = requestAnimationFrame(processFrame);
      } catch {
        if (!cancelled) patchState({ error: "Failed to load face detection" });
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      faceLandmarkerRef.current?.close();
      faceLandmarkerRef.current = null;
    };
    // intentionally narrow — inner functions are stable via useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return state;
}
