import { useEffect, useState, useRef, useCallback } from 'react';
import type { ProctoringEventType } from '@/types/exam';

interface UseExamSecurityProps {
  attemptId: string;
  maxViolations: number; // We set this to 2 (1 warning + 1 strike)
  onTerminated: (reason: string) => void; // Redirect to blocked page
}

async function reportSecurityEvent(
  attemptId: string,
  type: ProctoringEventType,
  metadata?: Record<string, string | number | boolean>,
): Promise<void> {
  await fetch(`/api/v1/attempts/${attemptId}/proctoring-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, timestamp: Date.now(), metadata }),
  });
}

export const useExamSecurity = ({
  attemptId,
  maxViolations = 2,
  onTerminated,
}: UseExamSecurityProps) => {
  const [violations, setViolations] = useState(0);
  const [isTerminated, setIsTerminated] = useState(false);

  // Use a ref to keep the latest violations count in the event listener
  const violationsRef = useRef(violations);

  // Keep ref in sync with state
  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  const terminateExam = useCallback(async (reason: string) => {
    if (isTerminated) return;

    setIsTerminated(true);
    setViolations(maxViolations);

    // Fire-and-forget the termination event to the backend
    try {
      await reportSecurityEvent(attemptId, 'session_terminated', { reason });
    } catch (error) {
      console.error('Failed to send termination event:', error);
    }

    // Redirect to the blocked page
    onTerminated(reason);
  }, [attemptId, isTerminated, onTerminated, maxViolations]);

  const handleViolation = useCallback(async (eventType: ProctoringEventType) => {
    const currentCount = violationsRef.current + 1;
    setViolations(currentCount);

    // Send the violation event to the backend
    try {
      await reportSecurityEvent(attemptId, eventType, { violation_count: currentCount });
    } catch (error) {
      console.error('Failed to send violation event:', error);
    }

    // THE 1-WARNING, 2ND-STRIKE RULE
    if (currentCount >= maxViolations) {
      await terminateExam(`Exceeded maximum violations (${currentCount}). Last event: ${eventType}`);
    } else {
      // Show the warning (only for the first violation)
      alert(
        `⚠️ WARNING: You switched tabs or left the exam window.\n` +
        `This is your 1st and FINAL warning.\n` +
        `If you do this again (2nd violation), your exam will be automatically terminated.`
      );
    }
  }, [attemptId, maxViolations, terminateExam]);

  // Main effect: Attach the security listeners
  useEffect(() => {
    // 1. Visibility API (Tab switch / Minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolation('tab_switch');
      }
    };

    // 2. Window Blur (Clicked outside the browser window)
    const handleWindowBlur = () => {
      // Only trigger if the document is actually visible (prevents double-firing on minimize)
      if (document.visibilityState === 'visible') {
        handleViolation('window_blur');
      }
    };

    // 3. Window Focus (Re-entry - we log it but don't count it as a violation)
    const handleWindowFocus = () => {
      // We can optionally send a "focus_visible" event for telemetry, but not count it.
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Prevent right-click context menu (basic security)
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [handleViolation]);

  return { violations, isTerminated, handleViolation };
};
