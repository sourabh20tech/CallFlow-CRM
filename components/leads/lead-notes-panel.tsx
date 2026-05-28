"use client";

import { useState } from "react";
import { Loader2, MessageSquarePlus, Pin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/design-system/glass-card";
import { useLeadNotes } from "@/hooks/use-lead-notes";
import type { Note } from "@/types/note";
import { cn } from "@/lib/utils";
import { formControl } from "@/lib/design-system/styles";

interface LeadNotesPanelProps {
  leadId: string;
  apiBase?: string;
  className?: string;
  sectionId?: string;
  readOnly?: boolean;
  onNoteAdded?: () => void;
  composerLabel?: string;
  submitLabel?: string;
  emptyLabel?: string;
  historyLabel?: string;
  maxListHeightClassName?: string;
}

export function LeadNotesPanel({
  leadId,
  apiBase = "/api/leads",
  className,
  sectionId = "lead-detail-notes",
  readOnly = false,
  onNoteAdded,
  composerLabel = "Customer notes",
  submitLabel = "Add note",
  emptyLabel = "No notes yet for this lead.",
  historyLabel = "Notes history",
  maxListHeightClassName,
}: LeadNotesPanelProps) {
  const { notes, setNotes, isLoading, error, reload } = useLeadNotes({ leadId, apiBase });
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || readOnly) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = (await res.json()) as Note & { error?: string };
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error(data.error ?? "You do not have permission to add notes");
        }
        if (res.status === 404) {
          throw new Error(data.error ?? "Lead not found");
        }
        throw new Error(data.error ?? "Failed to save note");
      }
      setNotes((prev) => [data, ...prev]);
      setContent("");
      onNoteAdded?.();
      toast.success("Note added");
      void reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save note");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id={sectionId} className={cn("scroll-mt-4 space-y-4", className)}>
      {!readOnly && (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
          <label className="text-sm font-medium">{composerLabel}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Call outcome, objections, next steps..."
            rows={3}
            className={cn(formControl, "min-h-[88px] resize-none py-2.5")}
          />
          <Button type="submit" size="sm" disabled={isSaving || !content.trim()} className="gap-1.5">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="h-4 w-4" />
            )}
            {submitLabel}
          </Button>
        </form>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {readOnly ? "Notes" : historyLabel}
        </p>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : notes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul
            className={cn(
              "space-y-2",
              maxListHeightClassName ?? (readOnly ? "max-h-56 overflow-y-auto scrollbar-thin pr-1" : ""),
            )}
          >
            {notes.map((note) => (
              <li key={note.id}>
                <GlassCard
                  variant={readOnly ? "subtle" : "default"}
                  padding="sm"
                  className="text-sm"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className={cn(readOnly ? "text-xs text-muted-foreground" : "font-medium")}>
                      {note.authorName ?? (readOnly ? "You" : "Team")}
                      {readOnly
                        ? ` · ${new Date(note.createdAt).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}`
                        : ""}
                    </span>
                    {note.isPinned && (
                      <Pin className="h-3.5 w-3.5 text-amber-500" aria-label="Pinned" />
                    )}
                  </div>
                  <p className={cn("whitespace-pre-wrap", readOnly ? "leading-relaxed" : "text-muted-foreground")}>
                    {note.content}
                  </p>
                  {!readOnly && (
                    <time className="mt-2 block text-xs text-muted-foreground/80">
                      {new Date(note.createdAt).toLocaleString()}
                    </time>
                  )}
                </GlassCard>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
