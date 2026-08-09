import * as z from "zod";

export const practiceExamSchema = z.object({
  title: z.string().min(1, "Title is required"),
  timer_minutes: z.number().int().min(5, "Minimum 5 minutes").max(480, "Maximum 480 minutes"),
  mcq_count: z.number().int().min(1, "At least 1 question").max(50, "Maximum 50 questions"),
});
