import { useEffect, useState, useRef, useCallback } from 'react';
import { logService } from '@/lib/api';

interface UseExamSecurityProps {
  sessionId: string;
  maxViolations: number; // We set this to 2 (1 warning + 1 strike)
  onTerminated: () => void; // Redirect to blocked page
}

export const useExamSecurity = ({
  sessionId,
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
      await logService.terminateSession(sessionId, reason);
    } catch (error) {
      console.error('Failed to send termination event:', error);
    }
    
    // Redirect to the blocked page
    onTerminated();
  }, [sessionId, isTerminated, onTerminated, maxViolations]);

  const handleViolation = useCallback(async (eventType: string) => {
    const currentCount = violationsRef.current + 1;
    setViolations(currentCount);
    
    // Send the focus loss event to the backend
    try {
      await logService.sendFocusEvent(sessionId, {
        timestamp: Date.now(),
        event_type: eventType,
        violation_count: currentCount,
      });
    } catch (error) {
      console.error('Failed to send focus event:', error);
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
  }, [sessionId, maxViolations, terminateExam]);

  // Main effect: Attach the security listeners
  useEffect(() => {
    // 1. Visibility API (Tab switch / Minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolation('visibility_hidden');
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
      // logService.sendFocusEvent(sessionId, { timestamp: Date.now(), event_type: 'focus_visible', violation_count: violationsRef.current });
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
  }, [handleViolation, sessionId]);

  return { violations, isTerminated };
};