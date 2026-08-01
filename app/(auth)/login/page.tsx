"use client"
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/schemas/login-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { signIn, signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import z from "zod";
import AuthCard, { authInputCls } from "../_components/AuthCard";

const redirectMap: Record<string, string> = {
  TEACHER: '/instructor',
  STUDENT: '/student',
};

function LoginPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { update } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const paramError = searchParams.get('error');

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (paramError === 'SessionExpired') {
      signOut({ callbackUrl: '/' });
    }
  }, [paramError]);

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!result?.ok || result.url == null) {
        toast.error('Invalid email or password', {
          style: { backgroundColor: 'red', color: 'white' },
        });
        return;
      }

      const updatedSession = await update();
      const role = updatedSession?.role as string | undefined;
      const target = callbackUrl || (role ? redirectMap[role] : null) || '/';
      router.push(target);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while logging in. Please try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Log in" subtitle="Welcome back — enter your details to continue." closeHref="/">
      <div className="flex bg-forest rounded-lg p-0.75 mb-4.5 gap-0.75 py-2 border border-sand-border items-center justify-center text-white">
        Log in
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
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

        <Button
          type="submit"
          disabled={loading}
          className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 text-[14px] font-medium bg-forest text-white mt-4 gap-2 py-4 rounded-[9px]"
        >
          Log in <ArrowRight size={15} aria-hidden="true" />
        </Button>
      </form>

      <div className="mt-4 flex items-center">
        <Link href="/signup" className="text-muted-foreground underline">Create an account</Link>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
