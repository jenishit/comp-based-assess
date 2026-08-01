export type ProctoringEventType =
  | "face_absent"
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
  | "gaze_sample";

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
