"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, ArrowRight } from "lucide-react";
import { examJoinService } from "@/services/exam-service";
import { getJoinErrorMessage } from "@/lib/join-error";
import { toast } from "sonner";
import PinStep from "./_components/PinStep";
import DetailsStep from "./_components/DetailsStep";

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
      const res = await examJoinService({ pin: pin.join(""), name, email });
      if (res.success) {
        setExamInfo(res.data);
        setStep("done");
        toast.success("Joined exam successfully!");
      } else {
        toast.error(res.message || "Failed to join exam");
        setStep("details");
      }
    } catch (err) {
      toast.error(getJoinErrorMessage(err));
      setStep("pin");
    }
  };

  const enterExam = () => {
    if (examInfo) {
      router.push(`/test/${pin.join("")}?attempt_id=${examInfo.attempt_id}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-medium text-espresso tracking-tight">Join Exam</h1>
        <p className="text-bark text-sm mt-1">Enter the PIN provided by your instructor.</p>
      </div>

      <div className="bg-card rounded-xl border border-sand-border p-6">
        {step === "pin" && (
          <PinStep
            pin={pin}
            inputRefs={inputRefs}
            onPinChange={handlePinChange}
            onKeyDown={handleKeyDown}
            onContinue={() => setStep("details")}
            isPinComplete={isPinComplete}
          />
        )}

        {step === "details" && (
          <DetailsStep
            pin={pin.join("")}
            name={name}
            email={email}
            onNameChange={setName}
            onEmailChange={setEmail}
            onBack={() => setStep("pin")}
            onJoin={handleJoin}
          />
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
            <h3 className="text-base font-medium text-espresso mb-1">You&apos;re in!</h3>
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
