"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { PageHeader } from "@/components/design-system/page-header";
import { Button } from "@/components/ui/button";
import { pageSection } from "@/lib/design-system/styles";

interface AgentWorkspaceErrorProps {
  message: string;
}

export function AgentWorkspaceError({ message }: AgentWorkspaceErrorProps) {
  return (
    <div className={pageSection}>
      <PageHeader title="My Workspace" description="Agent workspace" />
      <GlassCard variant="subtle" padding="lg" className="border-destructive/30">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-medium text-foreground">Could not load workspace</p>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="premium"
              size="sm"
              className="gap-1.5"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
