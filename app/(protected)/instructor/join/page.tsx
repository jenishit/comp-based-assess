"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, ArrowRight, Loader2, Check } from "lucide-react";
import { examService } from "@/services/exam-service";
import { toast } from "sonner";

export default function JoinExamPage() {
  const router = useRouter();
  const [step, setStep] = useState<"pin" | "details" | "joining" | "done">("pin");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [examInfo, setExamInfo] = useState<{ attempt_id: string; exam_id: string; title: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "pin") inputRefs.current[0]?.focus();
  }, [step]);

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && pin.every(Boolean) && step === "pin") {
      setStep("details");
    }
  };

  const isPinComplete = pin.every(Boolean);
  const isDetailsComplete = name.trim() !== "" && email.trim() !== "";

  const handleJoin = async () => {
    if (!isDetailsComplete) return;
    setStep("joining");
    try {
      const res = await examService.join({ pin: pin.join(""), name, email });
      if (res.success) {
        setExamInfo(res.data);
        setStep("done");
        toast.success("Joined exam successfully!");
      } else {
        toast.error(res.message || "Failed to join exam");
        setStep("details");
      }
    } catch {
      toast.error("Invalid PIN or exam not found");
      setStep("pin");
    }
  };

  const enterExam = () => {
    if (examInfo) {
      router.push(`/test/${pin.join("")}`);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-sand-border bg-cream text-sm text-espresso outline-none focus:border-forest transition-colors";

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-espresso tracking-tight">Join Exam</h1>
        <p className="text-bark text-sm mt-1">Enter the PIN provided by your instructor.</p>
      </div>

      <div className="bg-white rounded-xl border border-sand-border p-6">
        {step === "pin" && (
          <div className="text-center">
            <Key size={32} className="text-forest mx-auto mb-4" />
            <h3 className="text-base font-medium text-espresso mb-4">Enter 6-digit PIN</h3>
            <div className="flex gap-2 justify-center mb-6">
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 h-14 text-center text-xl font-medium rounded-xl border-2 outline-none transition-colors ${
                    digit ? "border-forest bg-forest/5" : "border-sand-border bg-white"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setStep("details")}
              disabled={!isPinComplete}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors disabled:opacity-50 cursor-pointer border-0"
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-4">
            <h3 className="text-base font-medium text-espresso">Your Details</h3>
            <p className="text-sm text-bark">PIN: <span className="font-mono font-semibold text-forest">{pin.join("")}</span></p>
            <div>
              <label className="block text-xs font-medium text-bark mb-1">Full Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-bark mb-1">Email *</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className={inputCls} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep("pin")} className="px-4 py-2.5 rounded-xl border border-sand-border text-sm font-medium text-bark hover:bg-sand-light transition-colors cursor-pointer bg-transparent">
                Back
              </button>
              <button onClick={handleJoin} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors cursor-pointer border-0">
                Join Exam <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === "joining" && (
          <div className="text-center py-10">
            <Loader2 size={32} className="animate-spin text-forest mx-auto mb-3" />
            <p className="text-sm text-bark">Joining exam...</p>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-forest" />
            </div>
            <h3 className="text-base font-medium text-espresso mb-1">You're in!</h3>
            <p className="text-sm text-bark mb-1">{examInfo?.title}</p>
            <p className="text-xs text-bark mb-6">Your camera will be requested when the session starts.</p>
            <button
              onClick={enterExam}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors cursor-pointer border-0"
            >
              Enter exam room <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
