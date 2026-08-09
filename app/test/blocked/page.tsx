"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";

function BlockedContent() {
  const params = useSearchParams();
  const reason = params?.get("reason") ?? "A proctoring violation was detected.";

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert size={28} className="text-red-400" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-medium text-white mb-3">
          Exam terminated
        </h2>
        <p className="text-[#9C96A8] text-[15px] leading-relaxed mb-2">
          {reason}
        </p>
        <p className="text-[#726C7E] text-[13px] mt-4">
          Your attempt has been recorded and flagged for review. Please contact
          your instructor if you believe this was a mistake.
        </p>
      </div>
    </div>
  );
}

export default function BlockedPage() {
  return (
    <Suspense fallback={null}>
      <BlockedContent />
    </Suspense>
  );
}
