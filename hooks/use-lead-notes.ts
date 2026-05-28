"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/typed-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { subscribeToTable } from "@/lib/db/realtime";
import type { Note } from "@/types/note";

interface UseLeadNotesOptions {
  leadId: string;
  apiBase: string;
}

export function useLeadNotes({ leadId, apiBase }: UseLeadNotesOptions) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!leadId?.trim()) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${leadId}/notes`, { cache: "no-store" });
      const data = (await res.json()) as { notes?: Note[]; error?: string };
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error(data.error ?? "You do not have permission to view these notes");
        }
        if (res.status === 404) {
          throw new Error(data.error ?? "Lead not found");
        }
        throw new Error(data.error ?? "Failed to load notes");
      }
      setNotes(Array.isArray(data.notes) ? data.notes : []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not load notes";
      setError(message);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiBase, leadId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !leadId?.trim()) return;

    const supabase = createBrowserSupabaseClient();
    const channel = subscribeToTable(supabase, "lead_notes", {
      event: "*",
      filter: `lead_id=eq.${leadId}`,
      onPayload: () => {
        void loadNotes();
      },
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [leadId, loadNotes]);

  return { notes, setNotes, isLoading, error, reload: loadNotes };
}
