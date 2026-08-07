"use client";

import { useState } from "react";
import { changePasswordService } from "@/services/auth-service";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-sand-border bg-cream text-sm text-espresso outline-none focus:border-sage transition-colors";

export default function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await changePasswordService(newPassword);
      toast.success("Password changed successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-sand-border p-5 max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound size={16} className="text-forest" aria-hidden="true" />
        <h2 className="text-base font-semibold text-espresso">Change password</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium text-bark mb-1" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            className={inputCls}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-bark mb-1" htmlFor="confirm-password">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            className={inputCls}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-forest text-white text-sm font-medium py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60 border-0 cursor-pointer"
        >
          {submitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          Update password
        </button>
      </form>
    </div>
  );
}
