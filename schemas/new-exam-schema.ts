import * as z from "zod";

export const newExamSchema = z
  .object({
    title: z.string().min(1, "Exam title is required"),
    subject: z.string().min(1, "Subject is required"),
    description: z.string().optional(),
    timer_minutes: z.number().int().min(5, "Minimum 5 minutes").max(480, "Maximum 480 minutes"),
    mcq_count: z.number().int().min(1, "At least 1 question").max(50, "Maximum 50 questions"),
    subject_id: z.string().optional(),
    group_id: z.string().optional(),
    term: z.string().optional(),
    // Recurring-daily availability window — all four set, or none (enforced below).
    available_from_date: z.string().optional(),
    available_until_date: z.string().optional(),
    daily_open_time: z.string().optional(),
    daily_close_time: z.string().optional(),
    // Require Safe Exam Browser for this exam (high-stakes lockdown).
    require_seb: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const fields = [
        data.available_from_date,
        data.available_until_date,
        data.daily_open_time,
        data.daily_close_time,
      ];
      const filled = fields.filter(Boolean).length;
      return filled === 0 || filled === 4;
    },
    { message: "Set all four schedule fields, or leave them all empty", path: ["available_from_date"] },
  )
  .refine(
    (data) =>
      !data.available_from_date ||
      !data.available_until_date ||
      data.available_from_date <= data.available_until_date,
    { message: "End date must be on or after the start date", path: ["available_until_date"] },
  )
  .refine(
    (data) => !data.daily_open_time || !data.daily_close_time || data.daily_open_time < data.daily_close_time,
    { message: "Closing time must be after opening time", path: ["daily_close_time"] },
  );
