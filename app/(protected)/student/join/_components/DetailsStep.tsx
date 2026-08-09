import { ArrowRight } from "lucide-react";

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-sand-border bg-cream text-sm text-espresso outline-none focus:border-forest transition-colors";

interface DetailsStepProps {
  pin: string;
  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onBack: () => void;
  onJoin: () => void;
}

export default function DetailsStep({ pin, name, email, onNameChange, onEmailChange, onBack, onJoin }: DetailsStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-espresso">Your Details</h3>
      <p className="text-sm text-bark">PIN: <span className="font-mono font-semibold text-forest">{pin}</span></p>
      <div>
        <label className="block text-xs font-medium text-bark mb-1">Full Name *</label>
        <input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Your full name" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-bark mb-1">Email *</label>
        <input value={email} onChange={(e) => onEmailChange(e.target.value)} type="email" placeholder="you@example.com" className={inputCls} />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="px-4 py-2.5 rounded-xl border border-sand-border text-sm font-medium text-bark hover:bg-sand-light transition-colors cursor-pointer bg-transparent">
          Back
        </button>
        <button onClick={onJoin} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors cursor-pointer border-0">
          Join Exam <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
