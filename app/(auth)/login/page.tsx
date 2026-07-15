"use client"
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/schemas/login-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { signIn, signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import z from "zod";

const inputCls =
  "w-full px-[13px] py-5 rounded-lg border-[1.5px] border-sand-border bg-cream " +
  "text-[14px] text-[#2A1A0E] outline-none focus:border-forest transition-colors";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { status, update } = useSession()
  const searchParams = useSearchParams()
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackUrl = searchParams.get('callbackUrl')
  const paramError = searchParams.get('error')
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const checkErrors = async () => {
      //If the session has expired then logout
      if (paramError && paramError == 'SessionExpired') {
        await signOut({ callbackUrl: '/' })
      }
    }

    checkErrors()
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
  }, [paramError])

  const redirectMap: Record<string, string> = {
    TEACHER: '/instructor',
    STUDENT: '/student',
  }

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!result?.ok || result.url == null) {
        toast.error('Invalid email or password', {
          style: { backgroundColor: 'red', color: 'white' },
        })
        return
      }

      const updatedSession = await update()
      const role = updatedSession?.role as string | undefined
      const target = callbackUrl || (role ? redirectMap[role] : null) || '/'
      router.push(target)
    } catch (err) {
      toast.error(
        "Something went wrong while logging in. Please try again later",
      );
      console.log(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
    }
  }, [status])

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
            
            <Button
              type="submit"
              disabled={loading}
              className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 text-[14px] font-medium bg-forest text-white mt-4 gap-2 py-4 rounded-[9px]"
            >
              Log in <ArrowRight size={15} aria-hidden="true" />
            </Button>
          </form>
          <div className="mt-4 flex items-center">
            <Link href="/signup" className="text-muted-foreground  underline">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
