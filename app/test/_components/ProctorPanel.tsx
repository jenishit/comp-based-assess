"use client"
import { Camera, Mic, Eye, Users, AlertTriangle, Copy, Monitor, LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { ProctoringState } from "@/types/exam";

interface ProctorPanelProps {
  proctoringState: ProctoringState;
  audioState: {
    voiceDetected: boolean;
    multipleSpeakers: boolean;
    noiseLevel: number;
    error: string | null;
  };
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

function StatusRow({
  icon: Icon,
  label,
  ok,
  warn,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  ok: boolean;
  warn?: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-sand-border last:border-0">
      <div className={clsx(
        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
        ok   ? "bg-forest/15 text-forest"
        : warn ? "bg-amber-400/15 text-amber-500"
        : "bg-red-400/15 text-red-500"
      )}>
        <Icon size={12} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[#1A100A] m-0 leading-none">{label}</p>
        {detail && (
          <p className="text-[10px] text-bark m-0 mt-0.5 truncate">{detail}</p>
        )}
      </div>
      <div className={clsx(
        "w-1.5 h-1.5 rounded-full shrink-0",
        ok ? "bg-forest" : warn ? "bg-amber-400" : "bg-red-400"
      )} />
    </div>
  );
}

export default function ProctorPanel({ proctoringState, audioState, videoRef }: ProctorPanelProps) {
  const { cameraReady, faceCount, gazeAway, gazeDirection,
          pasteCount, tabSwitches, windowBlurs, error } = proctoringState;
  const { voiceDetected, multipleSpeakers, noiseLevel }  = audioState;

  const faceOk      = faceCount === 1;
  const faceWarn    = faceCount === 0;
  const faceMulti   = faceCount > 1;
  const gazeOk      = !gazeAway;
  const audioOk     = !voiceDetected;
  const multiOk     = !multipleSpeakers;

  return (
    <div className="flex flex-col gap-4">

      {/* Camera feed */}
      <div className="relative rounded-xl overflow-hidden bg-espresso
                      border border-sand-border aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"  /* mirror for selfie-feel */
        />
        {!cameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Camera size={22} className="text-sand" aria-hidden="true" />
            <p className="text-[11px] text-sand">{error ?? "Starting camera…"}</p>
          </div>
        )}
        {/* Live badge */}
        {cameraReady && (
          <span className="absolute top-2 right-2 bg-red-500/90 text-white text-[9px]
                           font-semibold px-1.5 py-0.5 rounded tracking-wide">
            LIVE
          </span>
        )}
        {/* Gaze overlay */}
        {gazeAway && (
          <div className="absolute inset-x-0 bottom-0 bg-amber-400/90 px-2 py-1">
            <p className="text-[10px] font-semibold text-white text-center">
              Looking {gazeDirection} — please face the screen
            </p>
          </div>
        )}
      </div>

      {/* Noise level bar */}
      <div>
        <div className="flex justify-between text-[10px] text-bark mb-1">
          <span>Audio level</span>
          <span>{noiseLevel}%</span>
        </div>
        <div className="h-1.5 bg-sand-border rounded-full overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-300",
              noiseLevel < 30  ? "bg-forest"
              : noiseLevel < 65 ? "bg-amber-400"
              : "bg-red-400"
            )}
            style={{ width: `${noiseLevel}%` }}
          />
        </div>
      </div>

      {/* Proctoring status */}
      <div className="bg-white rounded-xl border border-sand-border px-3 py-1">
        <StatusRow
          icon={Camera}
          label={
            !cameraReady       ? "Camera offline"
            : faceMulti        ? `${faceCount} faces detected`
            : faceWarn         ? "No face detected"
            : "Face verified"
          }
          ok={faceOk}
          warn={faceWarn}
          detail={faceMulti ? "Only you should be in frame" : undefined}
        />
        <StatusRow
          icon={Eye}
          label={gazeOk ? "Looking at screen" : `Gaze: ${gazeDirection}`}
          ok={gazeOk}
          warn={gazeAway}
          detail={gazeAway ? "Please keep eyes on the exam" : undefined}
        />
        <StatusRow
          icon={Mic}
          label={audioOk ? "Audio normal" : "Voice detected"}
          ok={audioOk}
          warn={voiceDetected}
          detail={voiceDetected ? "No talking during exam" : undefined}
        />
        <StatusRow
          icon={Users}
          label={multiOk ? "Single person" : "Multiple voices"}
          ok={multiOk}
          warn={multipleSpeakers}
          detail={multipleSpeakers ? "Only you should be present" : undefined}
        />
        <StatusRow
          icon={Monitor}
          label={tabSwitches === 0 ? "All focus on exam" : `Tab switches: ${tabSwitches}`}
          ok={tabSwitches === 0}
          warn={tabSwitches > 0}
          detail={windowBlurs > 0 ? `Window blurs: ${windowBlurs}` : undefined}
        />
      </div>

      {/* Behavioral stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { Icon: Copy,    label: "Pastes",      val: pasteCount,  bad: pasteCount > 0  },
          { Icon: Monitor, label: "Tab switches", val: tabSwitches, bad: tabSwitches > 2 },
        ].map(({ Icon, label, val, bad }) => (
          <div key={label}
               className={clsx(
                 "rounded-xl border p-3 text-center",
                 bad ? "bg-red-50 border-red-200" : "bg-white border-sand-border"
               )}>
            <Icon size={16} className={clsx("mx-auto mb-1", bad ? "text-red-500" : "text-bark")} />
            <p className={clsx("text-[20px] font-semibold m-0",
                               bad ? "text-red-500" : "text-[#1A100A]")}>{val}</p>
            <p className="text-[10px] text-bark m-0">{label}</p>
          </div>
        ))}
      </div>

      {/* Warning banner */}
      {error && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200
                        rounded-xl px-3 py-2.5">
          <AlertTriangle size={14} className="text-amber-500 shrink-0" aria-hidden="true" />
          <p className="text-[11px] text-amber-700 m-0">{error}</p>
        </div>
      )}
    </div>
  );
}