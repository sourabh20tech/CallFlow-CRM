"use client";

import { useState } from "react";
import { Loader2, Lock, MessageSquarePlus, Pin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/design-system/glass-card";
import { useLeadNotes } from "@/hooks/use-lead-notes";
import { useAuth } from "@/hooks/use-auth";
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
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState<"public" | "internal">("public");
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
        body: JSON.stringify({ content: trimmed, noteType: isAdmin ? noteType : "public" }),
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
      setNoteType("public");
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
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isSaving || !content.trim()} className="gap-1.5">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquarePlus className="h-4 w-4" />
              )}
              {submitLabel}
            </Button>
            {isAdmin && (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={noteType === "internal"}
                  onChange={(e) => setNoteType(e.target.checked ? "internal" : "public")}
                  className="h-3.5 w-3.5 rounded border-border"
                />
                <Lock className="h-3 w-3" />
                Internal only
              </label>
            )}
          </div>
        </form>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {readOnly ? "Notes" : historyLabel}
          </p>
          {notes.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {notes.length}
            </span>
          )}
        </div>

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
                  <div className="mb-1.5 flex items-center gap-2">
                    {/* Author avatar */}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                      {note.authorAvatarUrl ? (
                        <img
                          src={note.authorAvatarUrl}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        (note.authorName ?? "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="truncate text-xs font-medium">
                        {note.authorName ?? "Team"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        · {new Date(note.createdAt).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {note.noteType === "internal" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          <Lock className="h-2.5 w-2.5" />
                          Internal
                        </span>
                      )}
                      {note.isPinned && (
                        <Pin className="h-3.5 w-3.5 text-amber-500" aria-label="Pinned" />
                      )}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {note.content}
                  </p>
                </GlassCard>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
