"use client";

import { useState } from "react";
import { Check, Loader2, MessageCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/design-system/glass-card";
import { cn } from "@/lib/utils";

const DEFAULT_TEMPLATE = "Hello {name},\nThank you for your interest.\nRegards, {agent_name}";
const VARIABLES = ["{name}", "{phone}", "{status}", "{source}", "{agent_name}"];

interface WhatsAppTemplateCardProps {
  /** Pass userId to allow admin to edit another agent's template */
  userId?: string;
}

export function WhatsAppTemplateCard({ userId }: WhatsAppTemplateCardProps) {
  const [template, setTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDefault, setIsDefault] = useState(true);

  // Load template on mount
  useState(() => {
    const url = userId
      ? `/api/agent/whatsapp-template?userId=${userId}`
      : "/api/agent/whatsapp-template";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setTemplate(data.template ?? DEFAULT_TEMPLATE);
        setIsDefault(data.isDefault ?? true);
      })
      .catch(() => setTemplate(DEFAULT_TEMPLATE))
      .finally(() => setIsLoading(false));
  });

  const handleSave = async () => {
    if (!template.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/agent/whatsapp-template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: template.trim(), userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      toast.success("WhatsApp template saved");
      setIsDefault(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/agent/whatsapp-template", { method: "DELETE" });
      const data = await res.json();
      setTemplate(data.template ?? DEFAULT_TEMPLATE);
      setIsDefault(true);
      toast.success("Template reset to default");
    } catch {
      toast.error("Failed to reset");
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    setTemplate((prev) => prev + variable);
  };

  if (isLoading) return null;

  return (
    <GlassCard variant="default" padding="md">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-semibold">WhatsApp Message Template</h3>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        This message will be pre-filled when you open WhatsApp for any lead. Use variables to personalize.
      </p>

      {/* Variable buttons */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {VARIABLES.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => insertVariable(v)}
            className="rounded border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] font-mono text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {v}
          </button>
        ))}
      </div>

      {/* Template textarea */}
      <textarea
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        rows={4}
        maxLength={500}
        className={cn(
          "w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm",
          "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        )}
        placeholder="Type your WhatsApp message template..."
      />

      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          disabled={!template.trim() || isSaving}
          onClick={() => void handleSave()}
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save Template
        </Button>
        {!isDefault && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={isSaving}
            onClick={() => void handleReset()}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
