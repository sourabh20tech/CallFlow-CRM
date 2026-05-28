"use client";

import { useCallback, useState } from "react";
import {
  Archive,
  Database,
  Phone,
  RefreshCw,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/design-system/glass-card";
import { StatusChip } from "@/components/design-system/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConfirmActionModal } from "@/components/settings/data-management/confirm-action-modal";
import type { DataManagementActionInput } from "@/utils/validators/data-management";
import type { DataManagementResource, TrashItem } from "@/types/data-management";
import { DATA_MANAGEMENT_RESOURCES } from "@/types/data-management";

type PendingConfirm = {
  title: string;
  description: string;
  confirmLabel: string;
  variant: "default" | "destructive";
  payload: DataManagementActionInput;
};

const RESOURCE_LABELS: Record<DataManagementResource, string> = {
  leads: "Leads",
  call_logs: "Call logs",
  follow_ups: "Follow-ups",
  agents: "Agents",
};

async function runAction(payload: DataManagementActionInput) {
  const res = await fetch("/api/admin/data-management", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as {
    error?: string;
    affectedCount?: number;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(json.error ?? "Request failed");
  }
  return json;
}

function parseUuidList(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f-]{36}$/i.test(s));
}

function ActionRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-background/30 p-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="ds-body font-medium text-foreground">{title}</p>
        <p className="ds-caption mt-1 text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[220px]">{children}</div>
    </div>
  );
}

export function DataManagementSection() {
  const [leadId, setLeadId] = useState("");
  const [leadBulkIds, setLeadBulkIds] = useState("");
  const [restoreLeadId, setRestoreLeadId] = useState("");
  const [callLogId, setCallLogId] = useState("");
  const [callLogDays, setCallLogDays] = useState("90");
  const [followUpId, setFollowUpId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [trashResource, setTrashResource] = useState<DataManagementResource>("leads");
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const queueConfirm = useCallback((config: PendingConfirm) => {
    setPending(config);
  }, []);

  const executePending = async () => {
    if (!pending) return;
    setIsBusy(true);
    try {
      const result = await runAction(pending.payload);
      const count = result.affectedCount ?? 0;
      if (count === 0) {
        toast.info("No matching records were updated", {
          description: result.message ?? "The item may already be deleted or restored.",
        });
      } else {
        toast.success("Done", {
          description: `${count} record${count === 1 ? "" : "s"} affected.`,
        });
      }
      setPending(null);
      void loadTrash();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setIsBusy(false);
    }
  };

  const loadTrash = useCallback(async () => {
    setTrashLoading(true);
    try {
      const params = new URLSearchParams({
        resource: trashResource,
        page: "1",
        pageSize: "25",
      });
      const res = await fetch(`/api/admin/data-management/trash?${params}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as { data?: TrashItem[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load trash");
      setTrashItems(json.data ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load trash");
      setTrashItems([]);
    } finally {
      setTrashLoading(false);
    }
  }, [trashResource]);

  return (
    <>
      <GlassCard variant="gradient" padding="md" className="border-amber-500/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="ds-h3">Data Management</h3>
              <p className="ds-body mt-1 max-w-2xl text-muted-foreground">
                Soft-delete records safely. Restore from trash or permanently remove only after
                records are in the trash. All actions require confirmation.
              </p>
            </div>
          </div>
          <StatusChip variant="warning" label="Admin only" />
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h4 className="ds-body font-semibold">Lead management</h4>
          </div>
          <ActionRow
            title="Delete lead"
            description="Moves a single lead to trash (soft delete)."
          >
            <div className="flex gap-2">
              <Input
                placeholder="Lead UUID"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!leadId.trim()}
                onClick={() =>
                  queueConfirm({
                    title: "Delete lead?",
                    description: "The lead will be hidden from lists and can be restored from trash.",
                    confirmLabel: "Move to trash",
                    variant: "destructive",
                    payload: {
                      resource: "leads",
                      action: "delete",
                      id: leadId.trim(),
                    },
                  })
                }
              >
                Delete
              </Button>
            </div>
          </ActionRow>
          <ActionRow
            title="Bulk delete leads"
            description="Comma- or line-separated lead UUIDs (max 500)."
          >
            <div className="flex flex-col gap-2 sm:min-w-[280px]">
              <textarea
                className="min-h-[72px] rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs"
                placeholder="uuid-1, uuid-2…"
                value={leadBulkIds}
                onChange={(e) => setLeadBulkIds(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={parseUuidList(leadBulkIds).length === 0}
                onClick={() => {
                  const ids = parseUuidList(leadBulkIds);
                  queueConfirm({
                    title: `Delete ${ids.length} leads?`,
                    description: "Selected leads will be soft-deleted and appear in trash.",
                    confirmLabel: "Bulk delete",
                    variant: "destructive",
                    payload: { resource: "leads", action: "bulk_delete", ids },
                  });
                }}
              >
                Bulk delete
              </Button>
            </div>
          </ActionRow>
          <ActionRow
            title="Restore deleted lead"
            description="Clears deleted_at for a lead in trash."
          >
            <div className="flex gap-2">
              <Input
                placeholder="Lead UUID"
                value={restoreLeadId}
                onChange={(e) => setRestoreLeadId(e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!restoreLeadId.trim()}
                onClick={() =>
                  queueConfirm({
                    title: "Restore lead?",
                    description: "The lead will be visible again in CRM lists.",
                    confirmLabel: "Restore",
                    variant: "default",
                    payload: {
                      resource: "leads",
                      action: "restore",
                      id: restoreLeadId.trim(),
                    },
                  })
                }
              >
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                Restore
              </Button>
            </div>
          </ActionRow>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <h4 className="ds-body font-semibold">Call logs management</h4>
          </div>
          <ActionRow title="Delete call log" description="Soft-delete one call log by ID.">
            <div className="flex gap-2">
              <Input
                placeholder="Call log UUID"
                value={callLogId}
                onChange={(e) => setCallLogId(e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!callLogId.trim()}
                onClick={() =>
                  queueConfirm({
                    title: "Delete call log?",
                    description: "The log will be removed from active views.",
                    confirmLabel: "Move to trash",
                    variant: "destructive",
                    payload: {
                      resource: "call_logs",
                      action: "delete",
                      id: callLogId.trim(),
                    },
                  })
                }
              >
                Delete
              </Button>
            </div>
          </ActionRow>
          <ActionRow
            title="Delete old logs / bulk cleanup"
            description="Soft-delete call logs older than the given number of days."
          >
            <div className="flex items-center gap-2">
              <Label htmlFor="call-days" className="sr-only">
                Days
              </Label>
              <Input
                id="call-days"
                type="number"
                min={1}
                max={3650}
                className="w-20"
                value={callLogDays}
                onChange={(e) => setCallLogDays(e.target.value)}
              />
              <span className="ds-caption text-muted-foreground">days</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const days = Number(callLogDays);
                  if (!Number.isFinite(days) || days < 1) return;
                  queueConfirm({
                    title: `Delete logs older than ${days} days?`,
                    description: "Matching call logs will be soft-deleted in bulk.",
                    confirmLabel: "Delete old logs",
                    variant: "destructive",
                    payload: {
                      resource: "call_logs",
                      action: "delete_old",
                      olderThanDays: days,
                    },
                  });
                }}
              >
                Delete old
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const days = Number(callLogDays);
                  if (!Number.isFinite(days) || days < 1) return;
                  queueConfirm({
                    title: `Bulk cleanup (${days}+ days)?`,
                    description: "Same as delete old — archives stale call logs to trash.",
                    confirmLabel: "Run cleanup",
                    variant: "destructive",
                    payload: {
                      resource: "call_logs",
                      action: "bulk_cleanup",
                      olderThanDays: days,
                    },
                  });
                }}
              >
                Bulk cleanup
              </Button>
            </div>
          </ActionRow>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <h4 className="ds-body font-semibold">Follow-ups management</h4>
          </div>
          <ActionRow title="Delete follow-up" description="Soft-delete a single follow-up task.">
            <div className="flex gap-2">
              <Input
                placeholder="Follow-up UUID"
                value={followUpId}
                onChange={(e) => setFollowUpId(e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!followUpId.trim()}
                onClick={() =>
                  queueConfirm({
                    title: "Delete follow-up?",
                    description: "Task will be hidden until restored from trash.",
                    confirmLabel: "Move to trash",
                    variant: "destructive",
                    payload: {
                      resource: "follow_ups",
                      action: "delete",
                      id: followUpId.trim(),
                    },
                  })
                }
              >
                Delete
              </Button>
            </div>
          </ActionRow>
          <ActionRow
            title="Delete completed tasks"
            description="Soft-deletes all follow-ups with status completed."
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queueConfirm({
                  title: "Delete all completed follow-ups?",
                  description: "Completed tasks will be moved to trash in bulk.",
                  confirmLabel: "Delete completed",
                  variant: "destructive",
                  payload: { resource: "follow_ups", action: "delete_completed" },
                })
              }
            >
              Delete completed
            </Button>
          </ActionRow>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserMinus className="h-4 w-4 text-muted-foreground" />
            <h4 className="ds-body font-semibold">Agent management</h4>
          </div>
          <ActionRow
            title="Deactivate or soft-delete agent"
            description="Deactivation keeps the record; soft delete moves the agent to trash."
          >
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Agent UUID"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!agentId.trim()}
                  onClick={() =>
                    queueConfirm({
                      title: "Deactivate agent?",
                      description: "Agent cannot take new work; record stays in the database.",
                      confirmLabel: "Deactivate",
                      variant: "default",
                      payload: {
                        resource: "agents",
                        action: "deactivate",
                        id: agentId.trim(),
                      },
                    })
                  }
                >
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!agentId.trim()}
                  onClick={() =>
                    queueConfirm({
                      title: "Soft-delete agent?",
                      description: "Agent is moved to trash and deactivated. Restore from trash if needed.",
                      confirmLabel: "Soft delete",
                      variant: "destructive",
                      payload: {
                        resource: "agents",
                        action: "soft_delete",
                        id: agentId.trim(),
                      },
                    })
                  }
                >
                  Soft delete
                </Button>
              </div>
            </div>
          </ActionRow>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              <h4 className="ds-body font-semibold">Trash system</h4>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="trash-resource" className="sr-only">
                Trash resource type
              </Label>
              <select
                id="trash-resource"
                value={trashResource}
                onChange={(e) => setTrashResource(e.target.value as DataManagementResource)}
                className="h-9 w-[160px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
              >
                {DATA_MANAGEMENT_RESOURCES.map((r) => (
                  <option key={r} value={r}>
                    {RESOURCE_LABELS[r]}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => void loadTrash()} disabled={trashLoading}>
                {trashLoading ? "Loading…" : "Refresh"}
              </Button>
            </div>
          </div>

          {trashItems.length === 0 ? (
            <p className="ds-caption rounded-lg border border-dashed border-border/50 px-4 py-6 text-center text-muted-foreground">
              {trashLoading
                ? "Loading trash…"
                : "No deleted records for this type. Use Refresh after deletions."}
            </p>
          ) : (
            <ul className="divide-y divide-border/40 rounded-xl border border-border/40">
              {trashItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="ds-body truncate font-medium">{item.label}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {item.id}
                      {item.meta ? ` · ${item.meta}` : ""}
                    </p>
                    <p className="ds-caption text-muted-foreground">
                      Deleted {new Date(item.deletedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        queueConfirm({
                          title: "Restore record?",
                          description: `${item.label} will be active again in the CRM.`,
                          confirmLabel: "Restore",
                          variant: "default",
                          payload: {
                            resource: "trash",
                            entity: item.resource,
                            action: "restore",
                            id: item.id,
                          },
                        })
                      }
                    >
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        queueConfirm({
                          title: "Permanently delete?",
                          description:
                            "This cannot be undone. The row will be removed from the database.",
                          confirmLabel: "Delete forever",
                          variant: "destructive",
                          payload: {
                            resource: "trash",
                            entity: item.resource,
                            action: "permanent_delete",
                            id: item.id,
                            confirmPermanent: true,
                          },
                        })
                      }
                    >
                      Permanent
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </GlassCard>

      <ConfirmActionModal
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.title ?? ""}
        description={pending?.description ?? ""}
        confirmLabel={pending?.confirmLabel}
        variant={pending?.variant}
        isLoading={isBusy}
        onConfirm={executePending}
      />
    </>
  );
}
