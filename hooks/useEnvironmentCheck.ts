"use client";
import { useEffect } from "react";
import type { ProctoringEvent } from "@/types/proctoring-types";
import {
  hasMultipleMonitors,
  installScreenCaptureGuard,
  runEnvironmentCheck,
} from "@/lib/proctoring/environment-check";

interface UseEnvironmentCheckOptions {
  enabled: boolean;
  /** Wire to the shared event batcher, same as the other monitor hooks. */
  onEvent: (event: ProctoringEvent) => void;
}

/**
 * Runs the environment scan once when the exam becomes active, reports the
 * findings as proctoring events, keeps watching for monitors being plugged
 * in mid-exam, and guards the in-page screen-capture API. Reports through
 * onEvent only — it holds no render state of its own.
 */
export function useEnvironmentCheck({ enabled, onEvent }: UseEnvironmentCheckOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const result = runEnvironmentCheck();
    const now = Date.now();
    // One summary event always lands (low severity) so instructors can see
    // the environment even when nothing was suspicious…
    onEvent({
      type: "environment_check",
      timestamp: now,
      metadata: {
        vmRenderer: result.vmRenderer,
        hardwareConcurrency: result.hardwareConcurrency,
        multipleMonitors: result.multipleMonitors,
        sebDetected: result.sebDetected,
      },
    });
    // …plus targeted events for anything that needs instructor attention.
    if (result.vmSuspected) {
      onEvent({ type: "vm_detected", timestamp: now, metadata: { renderer: result.vmRenderer } });
    }
    if (result.multipleMonitors) {
      onEvent({ type: "multiple_monitors", timestamp: now });
    }
    if (result.sebDetected) {
      onEvent({ type: "seb_detected", timestamp: now });
    }

    // A second display plugged in mid-exam raises the same flag.
    const screenWithEvents = window.screen as Screen & EventTarget;
    const onScreenChange = () => {
      if (hasMultipleMonitors()) {
        onEvent({ type: "multiple_monitors", timestamp: Date.now(), metadata: { midExam: true } });
      }
    };
    screenWithEvents.addEventListener?.("change", onScreenChange);

    const uninstallGuard = installScreenCaptureGuard(() => {
      onEvent({ type: "screen_capture_detected", timestamp: Date.now() });
    });

    return () => {
      screenWithEvents.removeEventListener?.("change", onScreenChange);
      uninstallGuard();
    };
    // onEvent comes from useProctoringEventBatcher and is identity-stable.
  }, [enabled, onEvent]);
}
