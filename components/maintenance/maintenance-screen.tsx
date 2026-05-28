"use client";

import Link from "next/link";
import { Construction, LogIn, Shield } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { Button } from "@/components/ui/button";
import { useCrmEnabled } from "@/hooks/use-crm-enabled";

export function MaintenanceScreen() {
  const { maintenanceTitle, maintenanceMessage, isLoading } = useCrmEnabled();

  return (
    <div className="maintenance-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div className="maintenance-orb maintenance-orb-a" aria-hidden />
      <div className="maintenance-orb maintenance-orb-b" aria-hidden />
      <div className="maintenance-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      <GlassCard
        variant="strong"
        padding="lg"
        className="maintenance-card ds-animate-scale relative z-10 w-full max-w-lg text-center"
      >
        <div className="maintenance-icon-wrap mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-600 dark:text-amber-400">
          <Construction className="maintenance-icon h-10 w-10" />
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
          Maintenance Mode
        </p>

        <h1 className="ds-h2">
          {isLoading ? "Checking system status…" : maintenanceTitle}
        </h1>

        <p className="ds-body mx-auto mt-4 max-w-md text-muted-foreground">
          {isLoading
            ? "Please wait while we verify platform availability."
            : maintenanceMessage}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              Admin sign in
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <Shield className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
