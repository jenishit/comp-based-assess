"use client";
import { signUpSchema } from "@/schemas/login-schema";
import { ArrowRight } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Suspense, useState } from "react";
import { registerService } from "@/services/auth-service";
import { RegisterPayload } from "@/types/auth-types";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AuthCard, { authInputCls } from "../_components/AuthCard";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const defaultRole = roleParam === "TEACHER" || roleParam === "STUDENT" ? roleParam : "";
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
      user_type: defaultRole,
    },
  });

  const email = useWatch({ control: form.control, name: "email" });
  const password = useWatch({ control: form.control, name: "password" });
  const userType = useWatch({ control: form.control, name: "user_type" });
  const isStudent = userType === "STUDENT";

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    if (!email || !password) return;
    setLoading(true);

    const payload: RegisterPayload = {
      name: data.full_name,
      email: data.email,
      password: data.password,
      role: data.user_type,
    };

    try {
      await registerService(payload);

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.success("Registered successfully. Please log in.");
        router.push("/login");
        return;
      }

      toast.success("Registered and logged in successfully.");
      router.push(data.user_type === "TEACHER" ? "/instructor" : "/student");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while registering you. Please try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title={isStudent ? "Student portal" : "Instructor portal"}
      subtitle={isStudent ? "Create your student account" : "Create your instructor account"}
      closeHref="/login"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <Controller
          name="full_name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <Label className="block text-xs font-medium text-bark mb-1">Full Name</Label>
              <Input type="text" placeholder="Eg: John Doe" {...field} className={authInputCls} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <Label className="block text-xs font-medium text-bark mb-1">Email</Label>
              <Input type="text" placeholder="Eg: john@example.com" {...field} className={authInputCls} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <Label className="block text-xs font-medium text-bark mb-1">Password</Label>
              <Input type="password" placeholder="*********" {...field} className={authInputCls} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="confirm_password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <Label className="block text-xs font-medium text-bark mb-1">Confirm Password</Label>
              <Input type="password" placeholder="*********" {...field} className={authInputCls} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="user_type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <Label className="block text-xs font-medium text-bark mb-1">Role</Label>
              <Select value={field.value} onValueChange={field.onChange} name={field.name}>
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">Proctor</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
    </AuthCard>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}
