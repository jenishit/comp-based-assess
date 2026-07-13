"use client";
import { signUpSchema } from "@/schemas/login-schema";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { registerService } from "@/services/auth-service";
import { RegisterPayload } from "@/types/auth-types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputCls =
  "w-full px-[13px] py-5 rounded-lg border-[1.5px] border-sand-border bg-cream " +
  "text-[14px] text-[#2A1A0E] outline-none focus:border-forest transition-colors";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
      role: "",
    },
  });

  const email = useWatch({
    control: form.control,
    name: "email",
  });

  const password = useWatch({
    control: form.control,
    name: "password",
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    if (!email || !password) return;
    setLoading(true);

    const payload: RegisterPayload = {
      name: data.first_name + " " + data.last_name,
      email: data.email,
      password: data.password,
      role: data.role,
    };

    try {
      await registerService(payload);
      toast.success(
        "Registered successfully. You will be redirected to login page",
      );
      router.push("/dashboard");
      setLoading(false);
    } catch (err) {
      toast.error(
        "Something went wrong while registering you. Please try again later",
      );
      console.log(err);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[rgba(14,8,3,0.72)] backdrop-blur-md
                 flex items-center justify-center p-5"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-105 overflow-hidden
                   shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
      >
        {/* Accent bar */}
        <div className="h-1 bg-linear-to-r from-forest to-sage" />

        <div className="px-7 py-6.5">
          {/* Header */}
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <GraduationCap
                size={18}
                className="text-forest"
                aria-hidden="true"
              />
              <span className="font-medium text-[17px] text-[#1A100A]">
                Instructor portal
              </span>
            </div>
            <Link
              aria-label="Close"
              className="bg-transparent border-0 cursor-pointer text-sand flex p-0.5
                         hover:text-bark transition-colors"
              href={"/"}
            >
              <ArrowLeft size={18} />
            </Link>
          </div>
          <p className="text-[13px] text-bark mb-4.5">
            Create your instructor account
          </p>

          <div
            className="flex bg-forest rounded-lg p-0.75 mb-4.5 gap-0.75 py-2
                          border border-sand-border items-center justify-center text-white"
          >
            Sign up
          </div>

          {/* Form */}
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <Controller
              name="first_name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <Label className="block text-xs font-medium text-bark mb-1">
                    First Name
                  </Label>
                  <Input
                    type="text"
                    placeholder="Eg: John"
                    {...field}
                    className={inputCls}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="last_name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <Label className="block text-xs font-medium text-bark mb-1">
                    Last Name
                  </Label>
                  <Input
                    type="text"
                    placeholder="Eg: Doe"
                    {...field}
                    className={inputCls}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <Label className="block text-xs font-medium text-bark mb-1">
                    Email
                  </Label>
                  <Input
                    type="text"
                    placeholder="Eg: john@example.com"
                    {...field}
                    className={inputCls}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <Label className="block text-xs font-medium text-bark mb-1">
                    Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="*********"
                    {...field}
                    className={inputCls}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirm_password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <Label className="block text-xs font-medium text-bark mb-1">
                    Confirm Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="*********"
                    {...field}
                    className={inputCls}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <Label className="block text-xs font-medium text-bark mb-1">
                    Role
                  </Label>

                  {/* Pass field props directly to Select */}
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    name={field.name}
                  >
                    <SelectTrigger className="w-full max-w-48">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                      <SelectItem value="STUDENT">Student</SelectItem>
                    </SelectContent>
                  </Select>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Button
              type="submit"
              disabled={loading}
              className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 text-[14px] font-medium bg-forest text-white mt-4 gap-2 py-4 rounded-[9px]"
            >
              Create account <ArrowRight size={15} aria-hidden="true" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
