import { ArrowLeft, GraduationCap } from "lucide-react";
import Link from "next/link";

export const authInputCls =
  "w-full px-[13px] py-5 rounded-lg border-[1.5px] border-sand-border bg-cream " +
  "text-[14px] text-[#2A1A0E] outline-none focus:border-forest transition-colors";

interface AuthCardProps {
  title: string;
  subtitle: string;
  closeHref: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, closeHref, children }: AuthCardProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[rgba(14,8,3,0.72)] backdrop-blur-md flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl w-full max-w-105 overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
        <div className="h-1 bg-linear-to-r from-forest to-sage" />

        <div className="px-7 py-6.5">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-forest" aria-hidden="true" />
              <span className="font-display text-[19px] text-[#1A100A]">{title}</span>
            </div>
            <Link
              aria-label="Close"
              className="bg-transparent border-0 cursor-pointer text-sand flex p-0.5 hover:text-bark transition-colors"
              href={closeHref}
            >
              <ArrowLeft size={18} />
            </Link>
          </div>
          <p className="text-[13px] text-bark mb-4.5">{subtitle}</p>

          {children}
        </div>
      </div>
    </div>
  );
}
