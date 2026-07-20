"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/design-system/form-field";
import { FormInput } from "@/components/design-system/form-input";
import { GlassCard } from "@/components/design-system/glass-card";
import { RoleTabs } from "@/components/auth/role-tabs";
import { useAuth } from "@/hooks/use-auth";
import { useCrmEnabled } from "@/hooks/use-crm-enabled";
import { INACTIVE_AGENT_LOGIN_MESSAGE } from "@/lib/auth/agent-account";
import { resolvePostLoginPath } from "@/lib/auth/post-login-path";
import { loginSchema, type LoginFormValues } from "@/lib/auth/schemas";
import { MAINTENANCE_PATH } from "@/lib/system/constants";
import type { UserRole } from "@/types/auth";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const router = useRouter();
  const { signIn } = useAuth();
  const { crmEnabled, isMaintenanceMode, maintenanceMessage } = useCrmEnabled();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", role: "agent" as UserRole },
  });

  const selectedRole = watch("role");
  const busy = isSigningIn || isSubmitting;

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (errorCode === "inactive") {
      toast.error(INACTIVE_AGENT_LOGIN_MESSAGE);
    }
    if (errorCode === "profile") {
      toast.error("Account setup incomplete", {
        description:
          "Your sign-in succeeded but no CRM profile was found. Run database migrations, set SUPABASE_SERVICE_ROLE_KEY, or contact an admin.",
      });
    }
  }, [searchParams]);

  const onSubmit = async (values: LoginFormValues) => {
    if (values.role === "agent" && !crmEnabled) {
      toast.error("Agent login is disabled", {
        description: maintenanceMessage,
      });
      return;
    }

    setIsSigningIn(true);
    try {
      const { error } = await signIn(values);

      if (error) {
        toast.error(error);
        return;
      }

      toast.success(`Welcome back, ${values.role === "admin" ? "Administrator" : "Agent"}!`);

      const destination = resolvePostLoginPath(redirectTo, values.role);
      router.push(destination);
      return;
    } catch (error) {
      console.error("[auth] login form error:", error);
      toast.error(error instanceof Error ? error.message : "Sign in failed. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <GlassCard variant="strong" padding="lg" className="ds-animate-scale w-full rounded-[18px] border-white/[0.06] bg-white/[0.025] px-4 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl lg:rounded-[20px] lg:px-5 lg:py-5">
      <div className="mb-3 text-center lg:mb-4">
        <h1 className="text-sm font-semibold text-white lg:text-base">Welcome back</h1>
        <p className="mt-0.5 text-[10px] text-zinc-400 lg:text-[11px]">
          Secure access for your CRM team
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 lg:space-y-4" noValidate>
        <FormField label="Portal" error={errors.role?.message} required>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <RoleTabs
                value={field.value}
                onChange={field.onChange}
                disabled={busy}
                agentDisabled={isMaintenanceMode}
              />
            )}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
          <div className="relative mt-1">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/90" />
            <FormInput
              id="email"
              type="email"
              placeholder={
                selectedRole === "admin" ? "admin@company.com" : "agent@company.com"
              }
              autoComplete="email"
              className="h-10 pl-10"
              {...register("email")}
            />
          </div>
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
          <div className="relative mt-1">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/90" />
            <FormInput
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-10 pl-10"
              {...register("password")}
            />
          </div>
          <div className="mt-2 flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary transition-colors hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </FormField>

        <Button type="submit" variant="premium" className="h-10 w-full lg:h-11" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          Sign in as {selectedRole === "admin" ? "Administrator" : "Agent"}
        </Button>
      </form>

      {isMaintenanceMode && (
        <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-center text-[11px] text-amber-400">
          CRM is in maintenance mode.{" "}
          <Link href={MAINTENANCE_PATH} className="font-medium underline">
            Learn more
          </Link>{" "}
          — only administrators may sign in.
        </p>
      )}
    </GlassCard>
  );
}
