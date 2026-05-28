"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquarePlus, Pin } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/design-system/glass-card";
import { Button } from "@/components/ui/button";
import type { Note } from "@/types/note";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

interface CallNotesSectionProps {
  callId: string | null;
  className?: string;
  onNoteAdded?: () => void;
}

export function CallNotesSection({ callId, className, onNoteAdded }: CallNotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!callId) {
      setNotes([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/calls/${callId}/notes`);
      if (!res.ok) throw new Error("Failed to load notes");
      const data = (await res.json()) as Note[];
      setNotes(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load notes");
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [callId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const handleAddNote = async () => {
    if (!callId || !noteText.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/calls/${callId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save note");
      setNotes((prev) => [data as Note, ...prev]);
      setNoteText("");
      toast.success("Note added");
      onNoteAdded?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save note");
    } finally {
      setIsSaving(false);
    }
  };

  if (!callId) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Select a call to view and add notes.
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleAddNote();
        }}
        className="space-y-2"
      >
        <label className="text-sm font-medium">Call notes</label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={3}
          placeholder="Outcome, objections, next steps…"
          className={cn(
            "w-full resize-none rounded-xl border border-[hsl(var(--ds-glass-border))]",
            "bg-[hsl(var(--ds-glass-bg))]/80 px-3.5 py-2 text-sm backdrop-blur-sm",
            "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
        />
        <Button
          type="submit"
          size="sm"
          disabled={isSaving || !noteText.trim()}
          className="gap-1.5"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquarePlus className="h-4 w-4" />
          )}
          Add note
        </Button>
      </form>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading notes…
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes for this call yet.</p>
      ) : (
        <ul className="max-h-[220px] space-y-2 overflow-y-auto scrollbar-thin">
          {notes.map((note) => (
            <li key={note.id}>
              <GlassCard padding="sm" className="text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{note.authorName ?? "Agent"}</span>
                  <time className="text-[0.6875rem] text-muted-foreground">
                    {formatRelativeTime(note.createdAt)}
                  </time>
                </div>
                <p className="whitespace-pre-wrap text-muted-foreground">{note.content}</p>
                {note.isPinned && <Pin className="mt-1 h-3 w-3 text-amber-500" aria-label="Pinned" />}
              </GlassCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
