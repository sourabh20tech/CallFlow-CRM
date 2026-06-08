"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Filter, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/design-system/page-header";
import { GlassCard } from "@/components/design-system/glass-card";
import { TablePagination } from "@/components/leads/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { pageSection } from "@/lib/design-system/styles";
import type { ActivityLog, ActivityLogFilters } from "@/types/activity-log";
import { cn } from "@/lib/utils";

const ACTION_ICONS: Record<string, string> = {
  login: "🔑",
  logout: "🚪",
  lead_created: "🟢",
  lead_updated: "✏️",
  lead_deleted: "🗑️",
  lead_assigned: "👤",
  lead_status_changed: "🔄",
  bulk_lead_upload: "📤",
  call_logged: "📞",
  call_updated: "📝",
  followup_created: "📅",
  followup_updated: "📅",
  followup_completed: "✅",
  note_added: "📌",
  note_edited: "📌",
  note_deleted: "📌",
  agent_created: "👥",
  agent_updated: "👥",
  agent_deactivated: "⛔",
};

const ACTION_TYPE_OPTIONS = [
  { value: "", label: "All Actions" },
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
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
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
      params.set("pageSize", "30");
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
        description={isAdmin ? "All CRM actions by users" : "Your recent actions and history"}
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

      {/* Filters */}
      <GlassCard variant="default" padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search activity..."
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
            placeholder="From"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 w-36"
            placeholder="To"
          />
        </div>
      </GlassCard>

      {/* Activity List */}
      <GlassCard variant="default" padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No activity found
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3 sm:px-6">
                <span className="mt-0.5 text-base">
                  {ACTION_ICONS[log.actionType] ?? "📋"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{log.actionDescription}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{log.userName}</span>
                    <span className={cn(
                      "rounded-full px-1.5 py-0 text-[10px] font-medium",
                      log.role === "admin" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}>
                      {log.role}
                    </span>
                    <span>·</span>
                    <time>{new Date(log.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
                    {log.entityType && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{log.entityType}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="border-t border-border/30 px-4 py-3">
            <TablePagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={30}
              onPageChange={setPage}
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
