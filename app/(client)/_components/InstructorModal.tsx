"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { GraduationCap, X, ArrowRight, Lock } from "lucide-react";
import clsx from "clsx";

interface Props { onClose: () => void; }

const inputCls =
  "w-full px-[13px] py-2.5 rounded-lg border-[1.5px] border-sand-border bg-cream " +
  "text-[14px] text-[#2A1A0E] outline-none focus:border-forest transition-colors";

export default function InstructorModal({ onClose }: Props) {
  const [view,     setView]     = useState<"signin" | "signup">("signin");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const switchView = (v: "signin" | "signup") => { setView(v); setError(""); };

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      if (view === "signup") {
        const res = await fetch("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role: "instructor" }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Registration failed.");
          return;
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) setError("Invalid email or password.");
      else window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[rgba(14,8,3,0.72)] backdrop-blur-md
                 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-105 overflow-hidden
                   shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className="h-1 bg-linear-to-r from-forest to-sage" />

        <div className="px-7 py-6.5">

          {/* Header */}
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-forest" aria-hidden="true" />
              <span className="font-medium text-[17px] text-[#1A100A]">Instructor portal</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="bg-transparent border-0 cursor-pointer text-sand flex p-0.5
                         hover:text-bark transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-[13px] text-bark mb-4.5">
            {view === "signin" ? "Sign in to manage your exams" : "Create your instructor account"}
          </p>

          {/* Sign in / Sign up toggle */}
          <div className="flex bg-sand-light rounded-lg p-0.75 mb-4.5 gap-0.75
                          border border-sand-border">
            {(["signin", "signup"] as const).map(v => (
              <button
                key={v}
                onClick={() => switchView(v)}
                className={clsx(
                  "flex-1 py-2 rounded-1.5 border-0 cursor-pointer text-[13px]",
                  "font-medium transition-all duration-200",
                  view === v ? "bg-forest text-white" : "bg-transparent text-bark hover:bg-sand-border/50"
                )}
              >
                {v === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="flex flex-col gap-3">
            {view === "signup" && (
              <div>
                <label className="block text-xs font-medium text-bark mb-1">Full name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  className={inputCls}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-bark mb-1">Email address</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="instructor@university.edu"
                type="email"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-bark mb-1">Password</label>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                className={inputCls}
              />
            </div>
          </div>

          {view === "signin" && (
            <div className="text-right mt-1.5">
              <span className="text-xs text-forest cursor-pointer font-medium hover:underline">
                Forgot password?
              </span>
            </div>
          )}

          {error && (
            <p className="text-[12.5px] text-red-600 mt-2.5">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-[9px]
                       border-0 text-[14px] font-medium bg-forest text-white mt-4
                       disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-forest-dark transition-colors cursor-pointer"
          >
            {loading ? "Please wait…" : view === "signin" ? "Sign in to EduQuest" : "Create account"}
            {!loading && <ArrowRight size={15} aria-hidden="true" />}
          </button>

          <p className="text-center mt-3 text-[11.5px] text-sand flex items-center justify-center gap-1">
            <Lock size={11} aria-hidden="true" />
            Protected by NextAuth — sessions encrypted with JWT
          </p>
        </div>
      </div>
    </div>
  );
}