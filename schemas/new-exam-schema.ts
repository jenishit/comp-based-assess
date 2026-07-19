import * as z from "zod";

export const newExamSchema = z.object({
  title: z.string().min(1, "Exam title is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  timer_minutes: z.coerce.number().int().min(5, "Minimum 5 minutes").max(480, "Maximum 480 minutes"),
  mcq_count: z.coerce.number().int().min(1, "At least 1 question").max(50, "Maximum 50 questions"),
});
