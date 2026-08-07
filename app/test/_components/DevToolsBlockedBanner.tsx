"use client";
import { Code2 } from "lucide-react";

interface DevToolsBlockedBannerProps {
  onResume: () => void;
}

export default function DevToolsBlockedBanner({ onResume }: DevToolsBlockedBannerProps) {
  return (
    <div className="fixed inset-0 z-200 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <Code2 size={26} className="text-blue-500" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-[#1A100A] m-0 mb-2">Browser DevTools is open</h2>
        <p className="text-sm text-bark leading-relaxed m-0 mb-5">
          Fullscreen mode can&apos;t stay active while DevTools is open, so this doesn&apos;t count as a
          warning. Close DevTools, then resume — the exam is paused until you do.
        </p>
        <button
          onClick={onResume}
          className="w-full py-3 rounded-xl font-medium bg-forest text-white hover:opacity-90 transition-opacity cursor-pointer border-0"
        >
          Resume exam
        </button>
      </div>
    </div>
  );
}
