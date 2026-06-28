"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/design-system/glass-card";
import { FormField } from "@/components/design-system/form-field";
import { FormInput } from "@/components/design-system/form-input";
import { cn } from "@/lib/utils";

const PRIORITIES = [
  { value: "low", label: "Low", color: "border-muted-foreground/40 text-muted-foreground" },
  { value: "medium", label: "Medium", color: "border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-950/20" },
  { value: "high", label: "High", color: "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
  { value: "urgent", label: "Urgent", color: "border-red-400 text-red-600 bg-red-50 dark:bg-red-950/20" },
];

export function SendAnnouncement() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string; profileId: string }[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAgents(data.map((a: any) => ({ id: a.id, name: a.name, profileId: a.profileId })));
        }
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          priority,
          recipientIds: sendToAll ? undefined : selectedAgents,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Announcement sent to ${data.sent} agent${data.sent !== 1 ? "s" : ""}`);
      setTitle(""); setMessage(""); setPriority("medium"); setSelectedAgents([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Send failed");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <GlassCard variant="default" padding="md">
      <div className="mb-4 flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Send Announcement</h3>
      </div>

      <div className="space-y-3">
        <FormField label="Title" htmlFor="ann-title" required>
          <FormInput id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="System maintenance tonight..." maxLength={100} />
        </FormField>

        <FormField label="Message" htmlFor="ann-message" required>
          <textarea
            id="ann-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Write your announcement..."
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </FormField>

        <FormField label="Priority" htmlFor="ann-priority">
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  priority === p.value ? p.color : "border-border text-muted-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Recipients" htmlFor="ann-target">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={sendToAll} onChange={() => setSendToAll(true)} className="h-4 w-4" />
              All Agents
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={!sendToAll} onChange={() => setSendToAll(false)} className="h-4 w-4" />
              Selected Agents
            </label>
            {!sendToAll && (
              <div className="max-h-32 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
                {agents.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedAgents.includes(a.profileId)}
                      onChange={(e) => {
                        setSelectedAgents((prev) =>
                          e.target.checked
                            ? [...prev, a.profileId]
                            : prev.filter((id) => id !== a.profileId),
                        );
                      }}
                      className="h-3.5 w-3.5 rounded"
                    />
                    {a.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </FormField>

        <Button
          onClick={() => void handleSend()}
          disabled={!title.trim() || !message.trim() || isSending || (!sendToAll && selectedAgents.length === 0)}
          className="w-full gap-1.5"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
          Send Announcement
        </Button>
      </div>
    </GlassCard>
  );
}
