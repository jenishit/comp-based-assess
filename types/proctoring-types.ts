export type ProctoringEventType =
  | "face_absent"
  | "face_returned"
  | "multiple_faces"
  | "gaze_away"
  | "gaze_returned"
  | "voice_detected"
  | "multiple_speakers"
  | "paste_event"
  | "tab_switch"
  | "window_blur"
  | "typing_stopped"
  | "typing_resumed"
  | "fullscreen_exit"
  | "pointer_lock_exit"
  | "session_terminated"
  | "keystroke_batch"
  | "gaze_sample"
  | "devtools_opened"
  // Lockdown enforcement (the action was prevented, then logged)
  | "copy_blocked"
  | "paste_blocked"
  | "back_navigation_blocked"
  | "shortcut_blocked"
  // Environment checks
  | "vm_detected"
  | "multiple_monitors"
  | "screen_capture_detected"
  | "seb_detected"
  | "environment_check"
  // Object detection
  | "phone_detected"
  | "book_detected";

export interface ProctoringEvent {
  type: ProctoringEventType;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface ProctoringState {
  cameraReady: boolean;
  faceCount: number;
  gazeAway: boolean;
  gazeDirection: "center" | "left" | "right" | "up" | "down";
  voiceDetected: boolean;
  multipleSpeakers: boolean;
  pasteCount: number;
  tabSwitches: number;
  windowBlurs: number;
  typingActive: boolean;
  error: string | null;
}

export interface ProctoringEventSummary {
  type: ProctoringEventType;
  count: number;
  severity: "low" | "medium" | "high";
}

export interface ProctoringEventDetail {
  type: ProctoringEventType;
  count: number;
  severity: "low" | "medium" | "high";
  timestamps: number[];
}

export interface GazeSample {
  timestamp: number;
  yaw?: number;
  pitch?: number;
  direction?: string;
  duration?: number;
}

/** A flagged-moment webcam snapshot, served with a short-lived presigned URL. */
export interface EvidenceCapture {
  id: string;
  event_type: ProctoringEventType;
  severity: "low" | "medium" | "high";
  timestamp: number;
  content_type: string;
  url: string;
}

/** Message shape broadcast on the exam-level live WebSocket channel. */
export type ExamLiveMessage =
  | {
      kind: "proctoring_event";
      attempt_id: string;
      type: ProctoringEventType;
      severity: "low" | "medium" | "high";
      timestamp: number;
      duration?: number | null;
      metadata?: Record<string, unknown> | null;
    }
  | {
      kind: "attempt_status";
      attempt_id: string;
      status: "in_progress" | "submitted";
      student_name?: string;
      student_email?: string;
    }
  | { kind: "evidence_captured"; attempt_id: string; event_type: ProctoringEventType; timestamp: number };
