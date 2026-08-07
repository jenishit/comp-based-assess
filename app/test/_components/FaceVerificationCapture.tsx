"use client";
import { useFaceVerificationCapture } from "@/hooks/useFaceVerificationCapture";

interface FaceVerificationCaptureProps {
  attemptId: string;
  enabled: boolean;
  cameraReady: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

/**
 * Renders nothing — exists only so useFaceVerificationCapture (and its
 * @vladmandic/human import chain) can be loaded via next/dynamic(ssr:false)
 * from the exam page. Hooks can't be dynamically imported directly; this is
 * the thinnest possible wrapper for one. See face-embedding.ts for why: its
 * Node.js build pulls in @tensorflow/tfjs-node, which breaks SSR.
 */
export default function FaceVerificationCapture(props: FaceVerificationCaptureProps) {
  useFaceVerificationCapture(props);
  return null;
}
