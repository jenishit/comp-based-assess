'use client';

import { ArrowRight, CircleCheck, Laptop, Loader2, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { examJoinService } from '@/services/exam-service';
import { toast } from 'sonner';

interface StudentModalProps {
  onClose: () => void;
}

export default function StudentModal({ onClose }: StudentModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [joining, setJoining] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 1) {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handlePinChange = (index: number, value: string) => {
    const valueChar = value.replace(/[^a-zA-Z0-9]/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = valueChar;
    setPin(newPin);
    if (valueChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isPinComplete = pin.every((d) => d);
  const isDetailsComplete = name.trim() !== '' && email.trim() !== '';

  const handleNextStep = async () => {
    if (step === 1 && isPinComplete) {
      setStep(2);
      return;
    }

    if (step === 2 && isDetailsComplete) {
      setJoining(true);
      try {
        const res = await examJoinService({ pin: pin.join(''), name, email });
        if (res.success) {
          setAttemptId(res.data.attempt_id);
          setStep(3);
        } else {
          toast.error(res.message || 'Failed to join exam');
        }
      } catch {
        toast.error('Invalid PIN or exam not found');
      } finally {
        setJoining(false);
      }
    }
  };

  const enterExam = () => {
    if (attemptId) {
      router.push(`/test/${pin.join('')}?attempt_id=${attemptId}`);
    }
  };

  const steps = ['Join exam', 'Your details', "You're in!"];
  const subtitles = [
    "Enter the 6-digit PIN from your instructor",
    "Help your instructor identify your submission",
    "The exam session is ready — good luck!",
  ];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
      <div className="h-1 bg-linear-to-r from-sage to-forest" />
      <div className="p-6 md:p-7">
        <div className="flex justify-between items-start mb-1">
          <span className="font-medium text-lg text-dark">{steps[step - 1]}</span>
          <button onClick={onClose} className="text-tan hover:text-brown transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-brown mb-4">{subtitles[step - 1]}</p>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-forest' : 'bg-border-lt'}`}
            />
          ))}
        </div>

        {/* Step contents */}
        {step === 1 && (
          <>
            <div className="flex gap-2 justify-center">
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  className={`w-11 h-14 text-center text-xl font-medium rounded-xl border-2 outline-none transition-colors ${
                    digit ? 'border-forest bg-forest/10' : 'border-border-lt bg-white'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-border-lt" />
              <span className="text-xs text-tan">or</span>
              <div className="flex-1 h-px bg-border-lt" />
            </div>
            <input
              type="text"
              placeholder="Paste join link here"
              className="w-full px-3 py-2.5 rounded-lg border-2 border-border-lt bg-tan-alt text-sm text-brown text-center outline-none focus:border-forest"
            />
            <button
              onClick={handleNextStep}
              disabled={!isPinComplete}
              className={`mt-4 w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-opacity ${
                isPinComplete ? 'bg-forest text-white hover:opacity-90' : 'bg-forest/60 text-white/60 cursor-not-allowed'
              }`}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-brown mb-1">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-border-lt bg-cream text-sm text-dark focus:border-forest outline-none"
                  placeholder="Aakash Sharma"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brown mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-border-lt bg-cream text-sm text-dark focus:border-forest outline-none"
                  placeholder="you@college.edu"
                />
              </div>
            </div>
            <div className="mt-3 p-3 bg-tan-alt rounded-lg flex gap-2 items-start">
              <Laptop className="w-3.5 h-3.5 text-tan mt-0.5 shrink-0" />
              <span className="text-xs text-brown leading-relaxed">
                Browser and device info will be collected for exam integrity. Your camera will be requested when the session starts.
              </span>              
            </div>
            <button
              onClick={handleNextStep}
              disabled={!isDetailsComplete || joining}
              className={`mt-4 w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-opacity ${
                isDetailsComplete && !joining ? 'bg-forest text-white hover:opacity-90' : 'bg-forest/60 text-white/60 cursor-not-allowed'
              }`}
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Joining...
                </>
              ) : (
                <>
                  Join exam <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        )}

        {step === 3 && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-forest/20 flex items-center justify-center mx-auto mb-4">
              <CircleCheck className="w-8 h-8 text-forest" />
            </div>
            <p className="font-medium text-lg text-dark">Welcome, {name || 'student'}!</p>
            <p className="text-sm text-brown mt-1.5 leading-relaxed">
              You&apos;ve joined the session. Make sure your camera is enabled and you&apos;re in a quiet space.
            </p>
            <button
              onClick={enterExam}
              className="mt-5 bg-forest text-white px-6 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer border-0"
            >
              Enter exam room <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}