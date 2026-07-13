"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ProctoringEvent, ProctoringEventType, ProctoringState } from "@/types/exam";
import type {
  FaceMeshInstance,
  FaceMeshResults,
  NormalizedLandmark,
} from "@/types/mediapipe";

// ── Narrow union types ────────────────────────────────────────────────
type GazeDirection = ProctoringState["gazeDirection"];

// ── Constants ─────────────────────────────────────────────────────────

// With refineLandmarks=true MediaPipe emits 478 landmarks (0–477).
// Indices for the iris + eye-corner landmarks we use:
const IDX = {
  R_IRIS:    468, // right iris centre
  L_IRIS:    473, // left iris centre
  R_OUTER:    33, // right eye lateral canthus
  R_INNER:   133, // right eye medial canthus
  L_OUTER:   263, // left eye lateral canthus
  L_INNER:   362, // left eye medial canthus
  R_TOP:     159, // right upper eyelid mid
  R_BOTTOM:  145, // right lower eyelid mid
} as const;

const FACE_MESH_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js";

const INITIAL_STATE: ProctoringState = {
  cameraReady:      false,
  faceCount:        0,
  gazeAway:         false,
  gazeDirection:    "center",
  voiceDetected:    false,
  multipleSpeakers: false,
  pasteCount:       0,
  tabSwitches:      0,
  windowBlurs:      0,
  typingActive:     false,
  error:            null,
};

// ── Options ───────────────────────────────────────────────────────────
interface UseProctoringOptions {
  examId:   string;
  enabled?: boolean;
  onEvent?: (event: ProctoringEvent) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useProctoringMonitor(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options:  UseProctoringOptions,
): ProctoringState {
  const { examId, enabled = true, onEvent } = options;

  const [state, setState] = useState<ProctoringState>(INITIAL_STATE);

  // ── Infrastructure refs ────────────────────────────────────────────
  const faceMeshRef     = useRef<FaceMeshInstance | null>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const rafRef          = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false); // prevent send() queue overflow

  // ── Event-throttle map ─────────────────────────────────────────────
  const lastFiredRef = useRef<Partial<Record<ProctoringEventType, number>>>({});

  // ── Absence/gaze-away onset timestamps ────────────────────────────
  const faceAbsentSinceRef  = useRef<number | null>(null);
  const gazeAwaySinceRef    = useRef<number | null>(null);

  // ── Behavioral counters ───────────────────────────────────────────
  const pasteCountRef       = useRef<number>(0);
  const tabSwitchCountRef   = useRef<number>(0);
  const windowBlurCountRef  = useRef<number>(0);

  // ── Typing state ──────────────────────────────────────────────────
  const typingActiveRef     = useRef<boolean>(false);
  const lastKeystrokeRef    = useRef<number>(Date.now());
  const typingTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────

  const patchState = useCallback((patch: Partial<ProctoringState>): void => {
    setState(s => ({ ...s, ...patch }));
  }, []);

  const canFire = useCallback(
    (type: ProctoringEventType, minGapMs: number): boolean => {
      const now  = Date.now();
      const last = lastFiredRef.current[type] ?? 0;
      if (now - last < minGapMs) return false;
      lastFiredRef.current[type] = now;
      return true;
    },
    [],
  );

  const reportEvent = useCallback(
    (event: Omit<ProctoringEvent, "timestamp">): void => {
      const full: ProctoringEvent = { ...event, timestamp: Date.now() };
      onEvent?.(full);
      fetch("/api/exam/proctor-event", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ examId, ...full }),
      }).catch(() => { /* fire-and-forget — never block the exam */ });
    },
    [examId, onEvent],
  );

  // ── Gaze estimation from iris landmarks ───────────────────────────
  //
  // hRatio: 0 → iris fully toward right temple; 1 → fully toward nose
  //          expected centre ≈ 0.50
  // vRatio: 0 → iris at top of eye; 1 → iris at bottom
  //          expected centre ≈ 0.50
  const estimateGaze = useCallback(
    (landmarks: NormalizedLandmark[]): { direction: GazeDirection; away: boolean } => {
      const fallback = { direction: "center" as GazeDirection, away: false };

      // Need all 478 iris landmarks
      if (landmarks.length < 478) return fallback;

      const get = (i: number): NormalizedLandmark => landmarks[i];

      // ── Horizontal ────────────────────────────────────────────────
      const eyeWR = Math.abs(get(IDX.R_INNER).x - get(IDX.R_OUTER).x);
      const eyeWL = Math.abs(get(IDX.L_INNER).x - get(IDX.L_OUTER).x);
      // Bail out if eye is too narrow to read (heavy squint / profile)
      if (eyeWR < 0.001 || eyeWL < 0.001) return fallback;

      const rH = (get(IDX.R_IRIS).x - get(IDX.R_OUTER).x) / (get(IDX.R_INNER).x - get(IDX.R_OUTER).x);
      const lH = (get(IDX.L_IRIS).x - get(IDX.L_OUTER).x) / (get(IDX.L_INNER).x - get(IDX.L_OUTER).x);
      const hRatio = (rH + lH) / 2;

      // ── Vertical ──────────────────────────────────────────────────
      const eyeH = Math.abs(get(IDX.R_BOTTOM).y - get(IDX.R_TOP).y);
      const vRatio = eyeH > 0.001
        ? (get(IDX.R_IRIS).y - get(IDX.R_TOP).y) / eyeH
        : 0.5;

      let direction: GazeDirection = "center";
      if      (hRatio < 0.28) direction = "right";
      else if (hRatio > 0.72) direction = "left";
      else if (vRatio < 0.25) direction = "up";
      else if (vRatio > 0.80) direction = "down";

      return { direction, away: direction !== "center" };
    },
    [],
  );

  // ── MediaPipe results handler ─────────────────────────────────────
  const onResults = useCallback(
    (results: FaceMeshResults): void => {
      isProcessingRef.current = false;

      const faces = results.multiFaceLandmarks;
      const count = faces.length;
      const now   = Date.now();

      patchState({ faceCount: count });

      // ── face absent ────────────────────────────────────────────────
      if (count === 0) {
        if (faceAbsentSinceRef.current === null) {
          faceAbsentSinceRef.current = now;
        }
        const goneMs = now - faceAbsentSinceRef.current;
        if (goneMs > 5_000 && canFire("face_absent", 10_000)) {
          reportEvent({
            type:     "face_absent",
            duration: goneMs,
            metadata: { secondsGone: Math.round(goneMs / 1_000) },
          });
        }
      } else {
        faceAbsentSinceRef.current = null;
      }

      // ── multiple faces ─────────────────────────────────────────────
      if (count > 1 && canFire("multiple_faces", 8_000)) {
        reportEvent({ type: "multiple_faces", metadata: { count } });
      }

      // ── gaze ───────────────────────────────────────────────────────
      if (count > 0) {
        const { direction, away } = estimateGaze(faces[0]);
        patchState({ gazeDirection: direction, gazeAway: away });

        if (away) {
          if (gazeAwaySinceRef.current === null) {
            gazeAwaySinceRef.current = now;
          }
          const awayMs = now - gazeAwaySinceRef.current;
          if (awayMs > 4_000 && canFire("gaze_away", 8_000)) {
            reportEvent({
              type:     "gaze_away",
              duration: awayMs,
              metadata: { direction, secondsAway: Math.round(awayMs / 1_000) },
            });
          }
        } else {
          if (gazeAwaySinceRef.current !== null) {
            reportEvent({ type: "gaze_returned" });
          }
          gazeAwaySinceRef.current = null;
        }
      }
    },
    [patchState, canFire, reportEvent, estimateGaze],
  );

  // ── Build FaceMesh instance ────────────────────────────────────────
  const initFaceMesh = useCallback((): void => {
    if (!window.FaceMesh) return;
    const fm = new window.FaceMesh({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
    });
    fm.setOptions({
      maxNumFaces:            3,
      refineLandmarks:        true,  // required for iris landmarks
      minDetectionConfidence: 0.5,
      minTrackingConfidence:  0.5,
    });
    fm.onResults(onResults);
    faceMeshRef.current = fm;
  }, [onResults]);

  // ── Per-frame processing loop ─────────────────────────────────────
  // Sends a video frame to FaceMesh only when the previous call has
  // finished (isProcessingRef guard), preventing queue build-up.
  const processFrame = useCallback((): void => {
    const video = videoRef.current;
    const fm    = faceMeshRef.current;

    if (
      !isProcessingRef.current &&
      video  !== null &&
      fm     !== null &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      !video.paused &&
      !video.ended
    ) {
      isProcessingRef.current = true;
      fm.send({ image: video }).catch(() => {
        isProcessingRef.current = false; // reset on error so loop continues
      });
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [videoRef]);

  // ── Camera ────────────────────────────────────────────────────────
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

  // ── Behavioral listeners ──────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const onPaste = (e: ClipboardEvent): void => {
      pasteCountRef.current += 1;
      const charCount = e.clipboardData?.getData("text").length ?? 0;
      patchState({ pasteCount: pasteCountRef.current });
      reportEvent({
        type:     "paste_event",
        metadata: { count: pasteCountRef.current, charCount },
      });
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

      if (typingTimerRef.current !== null) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => {
        typingActiveRef.current = false;
        patchState({ typingActive: false });
        reportEvent({
          type:     "typing_stopped",
          metadata: { idleMs: Date.now() - lastKeystrokeRef.current },
        });
      }, 15_000);
    };

    document.addEventListener("paste",             onPaste);
    document.addEventListener("visibilitychange",  onVisibilityChange);
    window.addEventListener("blur",                onWindowBlur);
    document.addEventListener("keydown",           onKeyDown);

    return () => {
      document.removeEventListener("paste",            onPaste);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur",               onWindowBlur);
      document.removeEventListener("keydown",          onKeyDown);
      if (typingTimerRef.current !== null) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [enabled, patchState, reportEvent, canFire]);

  // ── Main init: load MediaPipe CDN script + start camera ───────────
  useEffect(() => {
    if (!enabled) return;

    const boot = async (): Promise<void> => {
      await startCamera();
      rafRef.current = requestAnimationFrame(processFrame);
    };

    if (window.FaceMesh) {
      initFaceMesh();
      boot();
    } else {
      const script         = document.createElement("script");
      script.src           = FACE_MESH_CDN;
      script.crossOrigin   = "anonymous";
      script.onload        = () => { initFaceMesh(); boot(); };
      script.onerror       = () => patchState({ error: "Failed to load face detection" });
      document.head.appendChild(script);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      faceMeshRef.current?.close();
      faceMeshRef.current    = null;
      isProcessingRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]); // intentionally narrow — inner functions are stable via useCallback

  return state;
}
