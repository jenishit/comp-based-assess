import { CalendarClock } from "lucide-react";
import type { AvailabilityWindow } from "@/types/exam-types";

const STATE_STYLES: Record<string, string> = {
  not_started: "bg-blue-100 text-blue-700",
  open: "bg-green-100 text-green-700",
  closed_today: "bg-amber-100 text-amber-700",
  ended: "bg-gray-100 text-gray-500",
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(hms: string): string {
  const [hour, minute] = hms.split(":").map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const STATE_LABEL: Record<string, (w: AvailabilityWindow) => string> = {
  not_started: (w) => `Opens ${formatDate(w.available_from_date!)}`,
  open: (w) => `Open today until ${formatTime(w.daily_close_time!)}`,
  closed_today: (w) => `Closed for today — reopens ${formatTime(w.daily_open_time!)}`,
  ended: () => "Availability ended",
};

export default function AvailabilityBadge({ window }: { window: AvailabilityWindow }) {
  if (window.availability_state === "always_open") return null;

  const label = STATE_LABEL[window.availability_state]?.(window) ?? window.availability_state;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
        STATE_STYLES[window.availability_state] ?? "bg-gray-100 text-gray-500"
      }`}
    >
      <CalendarClock size={11} aria-hidden="true" />
      {label}
    </span>
  );
}
