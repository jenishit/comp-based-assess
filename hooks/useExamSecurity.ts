import { useEffect, useState, useRef, useCallback } from 'react';
import type { ProctoringEventType } from '@/types/proctoring-types';
import { reportProctoringEvent } from '@/lib/proctoring/report-event';

export interface SecurityWarning {
  count: number;
  maxViolations: number;
  eventType: ProctoringEventType;
}

// Docked DevTools (side or bottom panel, same window) forces Chromium
// browsers out of fullscreen — this is browser behavior we can't prevent,
// not something the student did. outerWidth/outerHeight include the panel;
// innerWidth/innerHeight don't, so a large gap between them is the standard
// heuristic for detecting it (160px is the threshold the devtools-detect
// library uses; ordinary browser chrome — tab bar, toolbar — is well under
// that). Undocked/separate-window DevTools doesn't affect this window's
// fullscreen state at all, so it doesn't need to be (and can't be) detected here.
const DEVTOOLS_GAP_THRESHOLD_PX = 160;

function isDevToolsOpen(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.outerWidth - window.innerWidth > DEVTOOLS_GAP_THRESHOLD_PX ||
    window.outerHeight - window.innerHeight > DEVTOOLS_GAP_THRESHOLD_PX
  );
}

// Native browser UI — a getUserMedia permission prompt, a download bar, even
// the URL bar taking a click — can steal document focus for a moment without
// the student actually switching away. document.hasFocus() (and the window
// `blur` event) reports that as a focus loss immediately, so a blur is only
// counted as a violation if focus hasn't come back within this window.
// visibilitychange-based tab_switch detection doesn't need this: a tab only
// goes 'hidden' when actually backgrounded, which permission prompts don't do.
const BLUR_GRACE_MS = 700;

interface UseExamSecurityProps {
  attemptId: string;
  maxViolations: number;
  onTerminated: (reason: string) => void;
  /** Gates the fullscreen enforcement effect — pass false while the exam is still loading or already submitted. */
  enabled: boolean;
}

export const useExamSecurity = ({
  attemptId,
  maxViolations = 3,
  onTerminated,
  enabled,
}: UseExamSecurityProps) => {
  const [violations, setViolations] = useState(0);
  const [isTerminated, setIsTerminated] = useState(false);
  const [warning, setWarning] = useState<SecurityWarning | null>(null);
  // Set when a fullscreen exit is attributable to DevTools being open —
  // shown as a blocking (but non-violation) banner instead of a strike.
  const [devToolsBlocking, setDevToolsBlocking] = useState(false);

  const violationsRef = useRef(violations);
  // Use a ref for the terminated guard to avoid stale-closure races when
  // multiple violation signals fire concurrently (e.g. fullscreen + blur).
  const isTerminatedRef = useRef(false);
  // Several independent signals (visibilitychange, blur, a focus poll) can
  // all fire for the same real-world event — dedupe by time rather than a
  // visibility-state heuristic, which doesn't hold on multi-monitor setups.
  const lastViolationAtRef = useRef(0);
  // True from the moment a fullscreen-exit violation opens the warning modal
  // until the student clicks "Resume". Opening DevTools (or anything else
  // that forces the browser out of fullscreen) can fire fullscreenchange
  // more than once for the same underlying event — without this guard those
  // extra events each counted as a *new* violation, which could burn all 3
  // strikes and terminate the exam without the student ever pressing Escape
  // or switching windows.
  const awaitingResumeRef = useRef(false);

  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  const terminateExam = useCallback(async (reason: string) => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;

    setIsTerminated(true);
    setViolations(maxViolations);
    setWarning(null);

    try {
      await reportProctoringEvent(attemptId, { type: 'session_terminated', timestamp: Date.now(), metadata: { reason } });
    } catch (error) {
      console.error('Failed to send termination event:', error);
    }

    onTerminated(reason);
  }, [attemptId, onTerminated, maxViolations]);

  const handleViolation = useCallback(async (eventType: ProctoringEventType) => {
    if (isTerminatedRef.current) return;
    // Already showing the warning for a fullscreen exit — ignore any further
    // fullscreenchange noise until the student clicks "Resume" (see
    // awaitingResumeRef above). Other violation types still count normally.
    if (eventType === 'fullscreen_exit' && awaitingResumeRef.current) return;

    const now = Date.now();
    if (now - lastViolationAtRef.current < 1000) return;
    lastViolationAtRef.current = now;

    const currentCount = violationsRef.current + 1;
    setViolations(currentCount);

    try {
      await reportProctoringEvent(attemptId, { type: eventType, timestamp: now, metadata: { violation_count: currentCount } });
    } catch (error) {
      console.error('Failed to send violation event:', error);
    }

    if (currentCount >= maxViolations) {
      await terminateExam(`Exceeded maximum violations (${currentCount}). Last event: ${eventType}`);
      return;
    }

    if (eventType === 'fullscreen_exit') awaitingResumeRef.current = true;
    // A custom in-page modal instead of a native alert() — showing alert()
    // while in fullscreen makes the browser itself force-exit fullscreen
    // (Chrome/Edge do this for any native dialog), which fired a *second*
    // fullscreenchange event and could cascade into extra violations before
    // the student ever got a chance to read the warning.
    setWarning({ count: currentCount, maxViolations, eventType });
  }, [attemptId, maxViolations, terminateExam]);

  // The DOM-listener effects below (fullscreen/visibility/blur) must NOT
  // depend on handleViolation directly: handleViolation is a new
  // function identity every time terminateExam changes, which is a new
  // identity every time the caller's onTerminated prop changes — and if that
  // prop is an inline arrow function (recreated every render), those effects
  // would tear down and re-run on *every re-render*. The fullscreen effect's
  // cleanup calls exitFullscreen() and its setup calls requestFullscreen(),
  // so that churn manifested as the page rapidly cycling out of and back
  // into fullscreen on its own — each exit could then be caught as a false
  // violation. A ref indirection lets the DOM listeners stay mounted once
  // while still always invoking the latest violation-handling logic.
  const handleViolationRef = useRef(handleViolation);
  useEffect(() => {
    handleViolationRef.current = handleViolation;
  }, [handleViolation]);

  const dismissWarning = useCallback(() => {
    setWarning(null);
    // Re-enter fullscreen from a real click (this function is only ever
    // called from the modal's "Resume" button), so the browser reliably
    // treats it as a user gesture — unlike calling requestFullscreen()
    // programmatically right after an alert() dismissal, which some
    // browsers refuse to honor.
    const result = document.documentElement.requestFullscreen?.();
    if (result) {
      result.catch(() => { /* user or browser denied */ }).finally(() => {
        awaitingResumeRef.current = false;
      });
    } else {
      awaitingResumeRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Guard: don't start listening for violations until the exam is active.
    // Without this, switching tabs while the page is still loading burns a
    // violation before the student has even seen a single question.
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolationRef.current('tab_switch');
      }
    };

    // Confirm the blur is real before counting it — see BLUR_GRACE_MS above.
    const confirmBlur = () => {
      window.setTimeout(() => {
        if (!document.hasFocus()) {
          handleViolationRef.current('window_blur');
        }
      }, BLUR_GRACE_MS);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', confirmBlur);

    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', preventContextMenu);

    // Fallback focus poll — on some multi-monitor + fullscreen combinations,
    // switching to a window on another display doesn't reliably fire `blur`
    // or `visibilitychange` at all. document.hasFocus() is a direct,
    // monitor-agnostic read of OS focus state.
    let wasFocused = document.hasFocus();
    const pollFocus = () => {
      const focused = document.hasFocus();
      if (wasFocused && !focused) {
        confirmBlur();
      }
      wasFocused = focused;
    };
    const focusPollId = setInterval(pollFocus, 1500);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', confirmBlur);
      document.removeEventListener('contextmenu', preventContextMenu);
      clearInterval(focusPollId);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.documentElement.requestFullscreen?.().catch(() => {
      /* user or browser denied — nothing more we can do here */
    });

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setDevToolsBlocking(false);
        return;
      }
      if (isDevToolsOpen()) {
        // Not the student's doing — don't burn a strike for something they
        // can't undo mid-exam. Still logged (medium severity) so a teacher
        // can see DevTools was open, just not auto-punished for it.
        setDevToolsBlocking(true);
        reportProctoringEvent(attemptId, { type: 'devtools_opened', timestamp: Date.now() }).catch(() => {});
        return;
      }
      handleViolationRef.current('fullscreen_exit');
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [enabled, attemptId]);

  // While the DevTools banner is up, keep checking in the background so the
  // banner clears itself the moment DevTools closes — the student still has
  // to click "Resume" to re-enter fullscreen (a real user gesture), but they
  // shouldn't have to guess when it's safe to try.
  useEffect(() => {
    if (!devToolsBlocking) return;
    const id = setInterval(() => {
      if (!isDevToolsOpen()) setDevToolsBlocking(false);
    }, 1000);
    return () => clearInterval(id);
  }, [devToolsBlocking]);

  const resumeFromDevTools = useCallback(() => {
    document.documentElement.requestFullscreen?.().catch(() => {
      /* still open, or otherwise denied — banner stays up */
    });
  }, []);

  return {
    violations,
    isTerminated,
    warning,
    dismissWarning,
    devToolsBlocking,
    resumeFromDevTools,
    handleViolation,
  };
};
