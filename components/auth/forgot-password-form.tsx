"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/design-system/form-field";
import { FormInput } from "@/components/design-system/form-input";
import { GlassCard } from "@/components/design-system/glass-card";
import { authService } from "@/services/auth.service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/utils/validators";

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    if (!isSupabaseConfigured()) {
      toast.error("Password reset requires Supabase configuration.");
      return;
    }

    const { error } = await authService.resetPassword(values);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Check your email for a reset link.");
  };

  return (
    <GlassCard variant="strong" padding="lg" className="ds-animate-scale w-full max-w-md">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="ds-h2">Reset password</h1>
        <p className="ds-body mt-2 text-muted-foreground">
          We&apos;ll email you a secure link to set a new password
        </p>
      </div>

      {isSubmitSuccessful ? (
        <div className="space-y-4 text-center">
          <p className="ds-body text-muted-foreground">
            If an account exists for that email, you&apos;ll receive reset instructions shortly.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
            <FormInput
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              {...register("email")}
            />
          </FormField>

          <Button type="submit" variant="premium" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Send reset link
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
        </form>
      )}
    </GlassCard>
  );
}
