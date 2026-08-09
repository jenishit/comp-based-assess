"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { attemptEvidenceListService } from "@/services/exam-service";
import type { EvidenceCapture } from "@/types/proctoring-types";

const severityRing: Record<string, string> = {
  high: "ring-red-300",
  medium: "ring-orange-300",
  low: "ring-amber-200",
};

interface EvidenceGalleryProps {
  attemptId: string;
}

/**
 * Flagged-moment webcam snapshots for one attempt. There is no continuous
 * recording — each image is the frame captured when a specific event fired
 * (an extra face, the student absent, a phone in view), so this reads as an
 * evidence timeline, not surveillance footage.
 */
export default function EvidenceGallery({ attemptId }: EvidenceGalleryProps) {
  const [captures, setCaptures] = useState<EvidenceCapture[]>([]);
  const [active, setActive] = useState<EvidenceCapture | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    attemptEvidenceListService(attemptId).then(setCaptures).catch(() => {});
  }, [attemptId]);

  if (captures.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Camera size={16} className="text-bark" />
        <h2 className="text-base font-semibold text-espresso">Flagged-moment evidence ({captures.length})</h2>
      </div>
      <p className="text-xs text-bark mb-3">
        Snapshots captured only when a proctoring event fired — not a continuous recording.
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {captures.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c)}
            className={`group relative aspect-square overflow-hidden rounded-lg ring-2 ${severityRing[c.severity] ?? "ring-gray-200"} cursor-pointer border-0 p-0 bg-transparent`}
            title={`${c.event_type.replace(/_/g, " ")} — ${new Date(c.timestamp).toLocaleTimeString()}`}
          >
            {/* Unoptimized: the src is a short-lived presigned URL, not a
                stable asset the Next image optimizer can cache. */}
            <Image
              src={c.url}
              alt={c.event_type}
              fill
              unoptimized
              className="object-cover transition-transform group-hover:scale-105"
            />
            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] py-0.5 px-1 truncate text-left">
              {c.event_type.replace(/_/g, " ")}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setActive(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActive(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white cursor-pointer bg-transparent border-0"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <Image
              src={active.url}
              alt={active.event_type}
              width={640}
              height={480}
              unoptimized
              className="w-full h-auto rounded-lg"
            />
            <div className="mt-3 flex items-center justify-between text-white">
              <span className="text-sm font-medium capitalize">{active.event_type.replace(/_/g, " ")}</span>
              <span className="text-xs text-white/70">{new Date(active.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
