"use client";

import ChangePasswordForm from "../../_components/ChangePasswordForm";

export default function StudentSettingsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-medium text-espresso tracking-tight">Settings</h1>
        <p className="text-bark text-sm mt-1">Manage your account.</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
