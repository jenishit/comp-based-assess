import { isAxiosError } from "axios";
import type { AvailabilityErrorDetail } from "@/types/exam-types";

// POST /exams/join returns a plain string `detail` for most failures (bad
// PIN, not on roster), but a structured {code, message} when blocked by the
// exam's availability window (see availability_error_detail in
// exam_availability.py) — that's the one case worth showing verbatim.
export function getJoinErrorMessage(err: unknown, fallback = "Invalid PIN or exam not found"): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (detail && typeof detail === "object" && "message" in detail) {
      return (detail as AvailabilityErrorDetail).message;
    }
    if (typeof detail === "string") return detail;
  }
  return fallback;
}
