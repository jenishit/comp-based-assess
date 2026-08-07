import type { ProctoringEventType } from "@/types/proctoring-types";

/**
 * Flagged-moment evidence snapshots.
 *
 * Privacy-by-design: there is NO continuous recording. A single webcam frame
 * is uploaded only when one of the event types below fires — the moments an
 * instructor actually needs to see (an extra person leaning in, the student
 * gone, a phone in frame). The backend enforces the same allowlist plus
 * per-attempt quotas, so a tampered client can't turn this into a stream.
 * Keep this set in sync with EVIDENCE_WORTHY_EVENTS in the backend's
 * app/schemas/_mappers.py.
 */
export const EVIDENCE_WORTHY_EVENTS: ReadonlySet<ProctoringEventType> = new Set<ProctoringEventType>([
  "multiple_faces",
  "face_absent",
  "face_returned",
  "phone_detected",
  "book_detected",
  "session_terminated",
]);

// Client-side floor between snapshots — the backend additionally enforces
// 1-per-5s and 60-per-attempt quotas.
const MIN_CAPTURE_GAP_MS = 8_000;
const JPEG_QUALITY = 0.7;

/** Pure gate, exported for tests. */
export function shouldCapture(
  eventType: ProctoringEventType,
  now: number,
  lastCaptureAt: number,
): boolean {
  return EVIDENCE_WORTHY_EVENTS.has(eventType) && now - lastCaptureAt >= MIN_CAPTURE_GAP_MS;
}

export interface EvidenceCapturer {
  /** Fire-and-forget: grabs a frame and uploads it iff the event type is
   * evidence-worthy and the client-side throttle allows it. */
  maybeCapture(eventType: ProctoringEventType): void;
}

export function createEvidenceCapturer(
  attemptId: string,
  videoRef: React.RefObject<HTMLVideoElement | null>,
): EvidenceCapturer {
  let lastCaptureAt = 0;

  return {
    maybeCapture(eventType) {
      const now = Date.now();
      if (!shouldCapture(eventType, now, lastCaptureAt)) return;

      const video = videoRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      lastCaptureAt = now;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx || canvas.width === 0) return;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const form = new FormData();
          form.append("image", blob, "evidence.jpg");
          form.append("event_type", eventType);
          form.append("timestamp", String(now));
          // Capability-based endpoint (attempt_id) — goes through the plain
          // rewrite, not the authenticated proxy, like the event reporters.
          fetch(`/api/v1/attempts/${attemptId}/evidence`, { method: "POST", body: form }).catch(() => {
            /* fire-and-forget — never block the exam */
          });
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    },
  };
}
