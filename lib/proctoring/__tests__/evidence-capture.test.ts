import { describe, expect, it } from "vitest";
import { shouldCapture, EVIDENCE_WORTHY_EVENTS } from "@/lib/proctoring/evidence-capture";

describe("shouldCapture", () => {
  it("captures evidence-worthy events after the throttle gap", () => {
    expect(shouldCapture("multiple_faces", 100_000, 0)).toBe(true);
    expect(shouldCapture("phone_detected", 100_000, 0)).toBe(true);
  });

  it("never captures routine telemetry (privacy boundary)", () => {
    // These are the high-frequency signals that must stay metadata-only.
    expect(shouldCapture("gaze_sample", 100_000, 0)).toBe(false);
    expect(shouldCapture("keystroke_batch", 100_000, 0)).toBe(false);
    expect(shouldCapture("typing_stopped", 100_000, 0)).toBe(false);
  });

  it("throttles rapid repeats of the same worthy event", () => {
    const now = 100_000;
    expect(shouldCapture("multiple_faces", now, now - 1_000)).toBe(false);
    expect(shouldCapture("multiple_faces", now, now - 8_000)).toBe(true);
  });

  it("evidence set does not include the noisy events", () => {
    expect(EVIDENCE_WORTHY_EVENTS.has("gaze_sample")).toBe(false);
    expect(EVIDENCE_WORTHY_EVENTS.has("phone_detected")).toBe(true);
  });
});
