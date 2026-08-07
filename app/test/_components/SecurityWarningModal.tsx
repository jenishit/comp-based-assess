"use client";
import { AlertTriangle } from "lucide-react";
import type { SecurityWarning } from "@/hooks/useExamSecurity";

interface SecurityWarningModalProps {
  warning: SecurityWarning;
  onDismiss: () => void;
}

const MESSAGE: Record<string, string> = {
  fullscreen_exit: "You exited fullscreen mode.",
  tab_switch: "You switched away from the exam tab.",
  window_blur: "You switched away from the exam window.",
};

export default function SecurityWarningModal({ warning, onDismiss }: SecurityWarningModalProps) {
  const remaining = warning.maxViolations - warning.count;

  return (
    <div className="fixed inset-0 z-200 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={26} className="text-amber-500" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-[#1A100A] m-0 mb-2">
          Warning {warning.count}/{warning.maxViolations}
        </h2>
        <p className="text-sm text-bark leading-relaxed m-0 mb-5">
          {MESSAGE[warning.eventType] ?? "A security violation was detected."}{" "}
          You have {remaining} warning{remaining !== 1 ? "s" : ""} remaining before your exam is
          automatically terminated.
        </p>
        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-xl font-medium bg-forest text-white hover:opacity-90 transition-opacity cursor-pointer border-0"
        >
          Resume exam
        </button>
      </div>
    </div>
  );
}
