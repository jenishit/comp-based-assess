import { emailRegex, passwordRegex } from "@/lib/utils";
import * as z from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .refine((val) => emailRegex.test(val), {
      message: "please enter a valid email address.",
    }),
  password: z.string().min(1, "Password is required"),
});

export const changePassword = z
  .object({
    new_password: z
      .string()
      .min(8, "Password needs to be 8 characters long")
      .refine((val) => passwordRegex.test(val), {
        message:
          "Password needs to have at least one uppercase, one lowercasem one number and one special character",
      }),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const signUpSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters long"),
  email: z
    .string()
    .min(1, "Email is required")
    .refine((val) => emailRegex.test(val), {
      message: "please enter a valid email address.",
    }),
  password: z
    .string()
    .min(8, "Password needs to be 8 characters long")
    .refine((val) => passwordRegex.test(val), {
      message:
        "Password needs to have at least one uppercase, one lowercasem one number and one special character",
    }),
  confirm_password: z.string(),
  user_type: z.string().min(2, "Select a role")
});
