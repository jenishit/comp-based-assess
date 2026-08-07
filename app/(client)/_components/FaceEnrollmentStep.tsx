'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, RotateCcw, ScanFace } from 'lucide-react';
import { embedFace, loadFaceModel } from '@/lib/proctoring/face-embedding';

const PROMPTS = [
  'Look straight ahead',
  'Turn slightly left',
  'Turn slightly right',
  'Look up slightly',
  'Look down slightly',
];

const MODEL_VERSION = 'vladmandic-human-faceres-v1';

interface FaceEnrollmentStepProps {
  /** Called once all 5 poses are captured, with the model_version to submit alongside them. */
  onComplete: (embeddings: number[][], modelVersion: string) => void;
}

export default function FaceEnrollmentStep({ onComplete }: FaceEnrollmentStepProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [embeddings, setEmbeddings] = useState<number[][]>([]);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Camera access denied';
      setCameraError(message);
      setCameraReady(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await startCamera();
    })();
    loadFaceModel()
      .then(() => setModelReady(true))
      .catch(() => setCaptureError('Failed to load the face-recognition model'));

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !cameraReady || !modelReady || capturing) return;

    setCapturing(true);
    setCaptureError(null);
    try {
      const result = await embedFace(video);
      if (!result.ok) {
        setCaptureError(
          result.reason === 'multiple_faces'
            ? 'More than one face detected — make sure only you are in frame'
            : 'No face detected — center your face in the frame',
        );
        return;
      }
      const next = [...embeddings, result.embedding];
      setEmbeddings(next);
      // Deliberately outside the state updater above — calling a parent's
      // setState (onComplete -> setEnrollSubmitting) from inside a
      // setEmbeddings updater runs during React's render phase and throws
      // "Cannot update a component while rendering a different component."
      if (next.length >= PROMPTS.length) {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onComplete(next, MODEL_VERSION);
      }
    } finally {
      setCapturing(false);
    }
  }, [cameraReady, modelReady, capturing, embeddings, onComplete]);

  const step = embeddings.length;
  const done = step >= PROMPTS.length;

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden bg-espresso aspect-video mb-3">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Camera className="w-5 h-5 text-sand" />
            <p className="text-xs text-sand">Starting camera…</p>
          </div>
        )}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-xs text-red-300">{cameraError}</p>
            <button
              onClick={() => {
                setCameraError(null);
                startCamera();
              }}
              className="mt-1 flex items-center gap-1.5 text-xs text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 cursor-pointer border-0"
            >
              <RotateCcw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1.5 mb-3">
        {PROMPTS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors ${i < step ? 'bg-forest' : 'bg-border-lt'}`}
          />
        ))}
      </div>

      {!done && (
        <>
          <p className="text-sm font-medium text-dark text-center mb-1">{PROMPTS[step]}</p>
          <p className="text-xs text-brown text-center mb-3">
            Capture {step + 1} of {PROMPTS.length}
          </p>
          {captureError && (
            <p className="text-xs text-red-500 text-center mb-2">{captureError}</p>
          )}
          <button
            onClick={handleCapture}
            disabled={!cameraReady || !modelReady || capturing}
            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-opacity ${
              cameraReady && modelReady && !capturing
                ? 'bg-forest text-white hover:opacity-90 cursor-pointer'
                : 'bg-forest/60 text-white/60 cursor-not-allowed'
            }`}
          >
            {capturing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Capturing...
              </>
            ) : !modelReady ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Loading model...
              </>
            ) : (
              <>
                <ScanFace className="w-4 h-4" /> Capture
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
