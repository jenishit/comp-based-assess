import { Key, ArrowRight } from "lucide-react";
import type { RefObject } from "react";

interface PinStepProps {
  pin: string[];
  inputRefs: RefObject<(HTMLInputElement | null)[]>;
  onPinChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onContinue: () => void;
  isPinComplete: boolean;
}

export default function PinStep({ pin, inputRefs, onPinChange, onKeyDown, onContinue, isPinComplete }: PinStepProps) {
  return (
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
            onChange={(e) => onPinChange(idx, e.target.value)}
            onKeyDown={(e) => onKeyDown(idx, e)}
            className={`w-11 h-14 text-center text-xl font-medium rounded-xl border-2 outline-none transition-colors ${
              digit ? "border-forest bg-forest/5" : "border-sand-border bg-white"
            }`}
          />
        ))}
      </div>
      <button
        onClick={onContinue}
        disabled={!isPinComplete}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors disabled:opacity-50 cursor-pointer border-0"
      >
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}
