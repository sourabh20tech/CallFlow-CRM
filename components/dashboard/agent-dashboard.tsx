"use client";

import { memo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  CalendarClock,
  Phone,
  PhoneCall,
  RefreshCw,
  Trophy,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { StatCard } from "@/components/design-system/stat-card";
import { GlassCard } from "@/components/design-system/glass-card";
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner";
import { Button } from "@/components/ui/button";
import { useAgentPanel } from "@/hooks/use-agent-panel";
import { pageSection, statsGrid } from "@/lib/design-system/styles";

// Lazy-load heavy widgets — they load after the main KPIs render
const FollowupCenterWidget = dynamic(
  () => import("@/components/dashboard/followup-center-widget").then((m) => m.FollowupCenterWidget),
  { ssr: false },
);
const WorkTimeWidget = dynamic(
  () => import("@/components/dashboard/work-time-widget").then((m) => m.WorkTimeWidget),
  { ssr: false },
);

export function AgentDashboard() {
  const { data, refresh, isRefreshing, isLoading, error } = useAgentPanel();

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const stats = data?.stats;
  const announcement = data?.announcement;
  const showAnnouncement = Boolean(announcement?.title || announcement?.message);

  return (
    <div className={pageSection}>
      <PageHeader
        title="My Dashboard"
        description="Your daily snapshot — open workspace for full workflow"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void refresh()}
              disabled={isRefreshing}
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button asChild size="sm" variant="premium" className="gap-1.5">
              <Link href="/dashboard/workspace">
                Open workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

      {error && (
        <GlassCard variant="subtle" padding="sm" className="border-destructive/30">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-1.5"
            onClick={() => void refresh()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </GlassCard>
      )}

      {showAnnouncement && (
        <AnnouncementBanner data={announcement} />
      )}

      <div className={statsGrid}>
        <StatCard title="My Leads" value={stats?.assignedLeads ?? 0} icon={UserPlus} />
        <StatCard title="Calls Today" value={stats?.callsToday ?? 0} icon={Phone} />
        <StatCard
          title="Follow-Ups Due"
          value={stats?.pendingFollowups ?? 0}
          icon={CalendarClock}
        />
        <StatCard title="Active Calls" value={stats?.activeCalls ?? 0} icon={PhoneCall} />
        <StatCard title="Converted" value={stats?.convertedLeads ?? 0} icon={Trophy} />
      </div>

      <WorkTimeWidget />

      <FollowupCenterWidget />

      <div className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-3">
        <GlassCard variant="default" padding="md" className="lg:col-span-3">
          <h3 className="ds-h3 mb-2">Today at a glance</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Manage leads, log dispositions, add notes, and complete follow-ups in your workspace.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Link
              href="/dashboard/workspace#leads"
              className="rounded-xl border border-border/40 bg-muted/20 px-3 py-3 transition-colors hover:bg-muted/40"
            >
              <p className="text-xs text-muted-foreground">Active leads</p>
              <p className="text-xl font-semibold">{stats?.assignedLeads ?? 0}</p>
            </Link>
            <Link
              href="/dashboard/workspace#followups"
              className="rounded-xl border border-border/40 bg-muted/20 px-3 py-3 transition-colors hover:bg-muted/40"
            >
              <p className="text-xs text-muted-foreground">Pending follow-ups</p>
              <p className="text-xl font-semibold">{stats?.pendingFollowups ?? 0}</p>
            </Link>
            <Link
              href="/dashboard/workspace#converted"
              className="rounded-xl border border-border/40 bg-muted/20 px-3 py-3 transition-colors hover:bg-muted/40"
            >
              <p className="text-xs text-muted-foreground">Converted</p>
              <p className="text-xl font-semibold">{stats?.convertedLeads ?? 0}</p>
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="premium">
              <Link href="/dashboard/workspace">Go to My Workspace</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/workspace#calls">Today&apos;s calls</Link>
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
