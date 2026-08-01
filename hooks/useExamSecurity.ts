import { useEffect, useState, useRef, useCallback } from 'react';
import type { ProctoringEventType } from '@/types/proctoring-types';
import { reportProctoringEvent } from '@/lib/proctoring/report-event';

interface UseExamSecurityProps {
  attemptId: string;
  maxViolations: number;
  onTerminated: (reason: string) => void;
  /** Gates the fullscreen/pointer-lock enforcement effects — pass false while the exam is still loading or already submitted. */
  enabled: boolean;
}

export const useExamSecurity = ({
  attemptId,
  maxViolations = 2,
  onTerminated,
  enabled,
}: UseExamSecurityProps) => {
  const [violations, setViolations] = useState(0);
  const [isTerminated, setIsTerminated] = useState(false);

  const violationsRef = useRef(violations);
  // Several independent signals (visibilitychange, blur, a focus poll) can
  // all fire for the same real-world event — dedupe by time rather than a
  // visibility-state heuristic, which doesn't hold on multi-monitor setups.
  const lastViolationAtRef = useRef(0);

  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  const terminateExam = useCallback(async (reason: string) => {
    if (isTerminated) return;

    setIsTerminated(true);
    setViolations(maxViolations);

    try {
      await reportProctoringEvent(attemptId, { type: 'session_terminated', timestamp: Date.now(), metadata: { reason } });
    } catch (error) {
      console.error('Failed to send termination event:', error);
    }

    onTerminated(reason);
  }, [attemptId, isTerminated, onTerminated, maxViolations]);

  const handleViolation = useCallback(async (eventType: ProctoringEventType) => {
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
    } else {
      alert(
        `⚠️ WARNING: You switched tabs or left the exam window.\n` +
        `This is your 1st and FINAL warning.\n` +
        `If you do this again (2nd violation), your exam will be automatically terminated.`
      );
    }
  }, [attemptId, maxViolations, terminateExam]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolation('tab_switch');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('window_blur');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

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
        handleViolation('window_blur');
      }
      wasFocused = focused;
    };
    const focusPollId = setInterval(pollFocus, 1500);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', preventContextMenu);
      clearInterval(focusPollId);
    };
  }, [handleViolation]);

  useEffect(() => {
    if (!enabled) return;

    document.documentElement.requestFullscreen?.().catch(() => {
      /* user or browser denied — nothing more we can do here */
    });

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation('fullscreen_exit');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [enabled, handleViolation]);

  // Escape exits fullscreen and pointer lock together in most browsers, so
  // this will often double-count alongside the fullscreen check above —
  // acceptable for a first pass.
  const pointerLockIntentionalRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const requestLock = () => {
      if (document.fullscreenElement && !document.pointerLockElement) {
        document.body.requestPointerLock?.();
      }
    };
    document.addEventListener('click', requestLock);

    const handlePointerLockChange = () => {
      if (!document.pointerLockElement && !pointerLockIntentionalRef.current) {
        handleViolation('pointer_lock_exit');
      }
      pointerLockIntentionalRef.current = false;
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('click', requestLock);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      if (document.pointerLockElement) {
        pointerLockIntentionalRef.current = true;
        document.exitPointerLock();
      }
    };
  }, [enabled, handleViolation]);

  return { violations, isTerminated, handleViolation };
};
