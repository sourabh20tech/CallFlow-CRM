"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Clock, Download, LogIn, RefreshCw, Search, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/design-system/page-header";
import { GlassCard } from "@/components/design-system/glass-card";
import { TablePagination } from "@/components/leads/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { pageSection } from "@/lib/design-system/styles";
import type { ActivityLog } from "@/types/activity-log";
import { cn } from "@/lib/utils";

// Badge color mapping by action category
function getActionBadge(actionType: string): { color: string; bgColor: string; label: string } {
  if (actionType.includes("created") || actionType === "login" || actionType === "bulk_lead_upload") {
    return { color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/15 border-blue-500/30", label: "Create" };
  }
  if (actionType.includes("updated") || actionType.includes("assigned") || actionType.includes("changed")) {
    return { color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/15 border-amber-500/30", label: "Update" };
  }
  if (actionType.includes("deleted") || actionType.includes("deactivated")) {
    return { color: "text-red-600 dark:text-red-400", bgColor: "bg-red-500/15 border-red-500/30", label: "Delete" };
  }
  if (actionType.includes("completed")) {
    return { color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/15 border-emerald-500/30", label: "Success" };
  }
  return { color: "text-muted-foreground", bgColor: "bg-muted/50 border-border", label: "Action" };
}

// Timeline dot color
function getDotColor(actionType: string): string {
  if (actionType.includes("created") || actionType === "login" || actionType === "bulk_lead_upload") return "bg-blue-500";
  if (actionType.includes("updated") || actionType.includes("assigned") || actionType.includes("changed")) return "bg-amber-500";
  if (actionType.includes("deleted") || actionType.includes("deactivated")) return "bg-red-500";
  if (actionType.includes("completed")) return "bg-emerald-500";
  return "bg-muted-foreground";
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { dateStyle: "short" });
}

const ACTION_TYPE_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "lead_created", label: "Lead Created" },
  { value: "lead_updated", label: "Lead Updated" },
  { value: "lead_assigned", label: "Lead Assigned" },
  { value: "lead_status_changed", label: "Status Changed" },
  { value: "lead_deleted", label: "Lead Deleted" },
  { value: "bulk_lead_upload", label: "Bulk Upload" },
  { value: "call_logged", label: "Call Logged" },
  { value: "call_updated", label: "Call Updated" },
  { value: "followup_created", label: "Follow-Up Created" },
  { value: "followup_completed", label: "Follow-Up Completed" },
  { value: "note_added", label: "Note Added" },
  { value: "agent_created", label: "Agent Created" },
  { value: "agent_deactivated", label: "Agent Deactivated" },
];

export function ActivityLogsPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionType, setActionType] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "50");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (actionType) params.set("actionType", actionType);
      if (roleFilter) params.set("role", roleFilter);
      if (dateFrom) params.set("from", new Date(`${dateFrom}T00:00:00`).toISOString());
      if (dateTo) params.set("to", new Date(`${dateTo}T23:59:59`).toISOString());

      const res = await fetch(`/api/activity-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Could not load activity logs");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, actionType, roleFilter, dateFrom, dateTo]);

  useEffect(() => { void loadLogs(); }, [loadLogs]);

  // Dashboard stats derived from current page data
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = logs.filter((l) => new Date(l.createdAt).toDateString() === today);
    return {
      totalToday: todayLogs.length,
      loginsToday: todayLogs.filter((l) => l.actionType === "login").length,
      leadsUpdated: todayLogs.filter((l) => l.actionType.startsWith("lead_")).length,
      followupsCompleted: todayLogs.filter((l) => l.actionType === "followup_completed").length,
    };
  }, [logs]);

  const handleExport = async (format: "csv" | "xlsx") => {
    try {
      const res = await fetch(`/api/activity-logs/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity-logs.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className={pageSection}>
      <PageHeader
        title={isAdmin ? "Activity Logs" : "My Activity"}
        description={isAdmin ? "Complete audit trail of all CRM actions" : "Your recent actions and history"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void loadLogs()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handleExport("csv")}>
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handleExport("xlsx")}>
                  <Download className="h-4 w-4" />
                  Excel
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat icon={Activity} label="Activities Today" value={stats.totalToday} color="text-primary" />
        <MiniStat icon={LogIn} label="Logins Today" value={stats.loginsToday} color="text-emerald-500" />
        <MiniStat icon={TrendingUp} label="Lead Actions" value={stats.leadsUpdated} color="text-blue-500" />
        <MiniStat icon={Clock} label="Follow-ups Done" value={stats.followupsCompleted} color="text-amber-500" />
      </div>

      {/* Filters */}
      <GlassCard variant="default" padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search user, action, lead..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <select
            value={actionType}
            onChange={(e) => { setActionType(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            {ACTION_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {isAdmin && (
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
            </select>
          )}
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 w-36"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 w-36"
          />
        </div>
      </GlassCard>

      {/* Activity Timeline */}
      <GlassCard variant="default" padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <Activity className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No activity found</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[27px] top-0 hidden h-full w-px bg-border/50 sm:block" />

            <div className="divide-y divide-border/20">
              {logs.map((log) => {
                const badge = getActionBadge(log.actionType);
                const meta = (log.metadata ?? {}) as Record<string, string | number | undefined>;

                return (
                  <div key={log.id} className="relative flex items-start gap-3 px-4 py-3.5 sm:px-6">
                    {/* Timeline dot */}
                    <div className="relative z-10 mt-1.5 hidden sm:block">
                      <span className={cn("block h-2.5 w-2.5 rounded-full ring-2 ring-background", getDotColor(log.actionType))} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start gap-2">
                        <p className="text-sm font-medium">{log.actionDescription}</p>
                        <span className={cn("rounded-full border px-1.5 py-0 text-[10px] font-medium", badge.bgColor, badge.color)}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Metadata row */}
                      {Object.keys(meta).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/80">
                          {meta.oldStatus && meta.newStatus && (
                            <span>
                              <span className="text-red-500">{String(meta.oldStatus)}</span>
                              {" → "}
                              <span className="text-emerald-500">{String(meta.newStatus)}</span>
                            </span>
                          )}
                          {meta.successCount !== undefined && (
                            <span>✓ {String(meta.successCount)} imported</span>
                          )}
                          {meta.failCount !== undefined && Number(meta.failCount) > 0 && (
                            <span>✗ {String(meta.failCount)} failed</span>
                          )}
                        </div>
                      )}

                      {/* User + time info */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="font-medium">{log.userName}</span>
                        <span className={cn(
                          "rounded-full px-1.5 py-0 text-[10px] font-medium",
                          log.role === "admin" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        )}>
                          {log.role}
                        </span>
                        <span>·</span>
                        <time className="font-medium" title={new Date(log.createdAt).toLocaleString()}>
                          {getRelativeTime(log.createdAt)}
                        </time>
                        <span className="hidden sm:inline">·</span>
                        <time className="hidden sm:inline">
                          {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </time>
                        {log.entityType && (
                          <>
                            <span>·</span>
                            <span className="capitalize">{log.entityType}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {totalPages > 1 && (
          <div className="border-t border-border/30 px-4 py-3">
            <TablePagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={50}
              onPageChange={setPage}
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-[hsl(var(--ds-glass-bg))] px-3 py-3 sm:px-4">
      <Icon className={cn("h-4 w-4 shrink-0", color)} />
      <div>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
