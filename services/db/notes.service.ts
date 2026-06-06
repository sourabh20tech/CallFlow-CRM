import { BaseDbService } from "@/services/db/base.service";
import {
  handleQuery,
  handleQueryOrThrow,
  NOTE_LIST_SELECT,
  requireCurrentUserId,
  requireRow,
} from "@/lib/db/api-helpers";
import { TABLES } from "@/lib/db/table-names";
import { DbError, toDbError } from "@/lib/db/errors";
import { mapNoteRow } from "@/lib/db/mappers";
import type { NoteWithAuthor } from "@/types/database";
import type { CreateNoteInput, Note, UpdateNoteInput } from "@/types/note";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";

const LEAD_NOTES_TABLE = TABLES.LEAD_NOTES;

function isMissingLeadNotesTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
}

function logNotesWarning(label: string, error: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[lead_notes] ${label}:`, error);
  }
}

export class NotesDbService extends BaseDbService {
  private leadNotesQuery(supabase: TypedSupabaseClient) {
    return supabase.from(LEAD_NOTES_TABLE);
  }

  async listByLead(leadId: string, client?: TypedSupabaseClient, excludeInternal = false): Promise<Note[]> {
    if (!leadId?.trim()) return [];

    const supabase = await this.db(client);
    let query = this.leadNotesQuery(supabase)
      .select(NOTE_LIST_SELECT)
      .eq("lead_id", leadId)
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    // Filter out internal notes for agents
    if (excludeInternal) {
      query = query.neq("note_type" as any, "internal");
    }

    const result = await handleQuery(query);

    if (result.error) {
      logNotesWarning("listByLead", result.error);
      if (isMissingLeadNotesTable(result.error)) return [];
      return [];
    }

    return ((result.data ?? []) as NoteWithAuthor[]).map(mapNoteRow);
  }

  async listByCallLog(callLogId: string, client?: TypedSupabaseClient): Promise<Note[]> {
    if (!callLogId?.trim()) return [];

    const supabase = await this.db(client);
    const result = await handleQuery(
      this.leadNotesQuery(supabase)
        .select(NOTE_LIST_SELECT)
        .eq("call_log_id", callLogId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    );

    if (result.error) {
      logNotesWarning("listByCallLog", result.error);
      return [];
    }

    return ((result.data ?? []) as NoteWithAuthor[]).map(mapNoteRow);
  }

  async listByFollowup(followupId: string, client?: TypedSupabaseClient): Promise<Note[]> {
    if (!followupId?.trim()) return [];

    const supabase = await this.db(client);
    const result = await handleQuery(
      this.leadNotesQuery(supabase)
        .select(NOTE_LIST_SELECT)
        .eq("followup_id", followupId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    );

    if (result.error) {
      logNotesWarning("listByFollowup", result.error);
      return [];
    }

    return ((result.data ?? []) as NoteWithAuthor[]).map(mapNoteRow);
  }

  async create(input: CreateNoteInput, client?: TypedSupabaseClient): Promise<Note> {
    const supabase = await this.db(client);
    const authorId = await requireCurrentUserId(supabase);

    if (!input.leadId?.trim()) {
      throw new DbError("A lead_id is required to create a note", "VALIDATION");
    }

    const insertPayload: Record<string, unknown> = {
      lead_id: input.leadId,
      call_log_id: input.callLogId ?? null,
      followup_id: input.followupId ?? null,
      author_id: authorId,
      content: input.content.trim(),
      is_pinned: input.isPinned ?? false,
      note_type: input.noteType ?? "public",
    };

    try {
      const data = await handleQueryOrThrow(
        this.leadNotesQuery(supabase)
          .insert(insertPayload as any)
          .select(NOTE_LIST_SELECT)
          .single(),
      );
      return mapNoteRow(data as NoteWithAuthor);
    } catch (error) {
      throw toDbError(error, "Failed to create lead note");
    }
  }

  async update(
    id: string,
    input: UpdateNoteInput,
    client?: TypedSupabaseClient,
  ): Promise<Note> {
    const supabase = await this.db(client);

    try {
      const data = await handleQueryOrThrow(
        this.leadNotesQuery(supabase)
          .update({
            content: input.content?.trim(),
            is_pinned: input.isPinned,
          })
          .eq("id", id)
          .is("deleted_at", null)
          .select(NOTE_LIST_SELECT)
          .single(),
      );

      return mapNoteRow(requireRow(data as NoteWithAuthor | null, "Note", id));
    } catch (error) {
      throw toDbError(error, "Failed to update lead note");
    }
  }

  async delete(id: string, client?: TypedSupabaseClient): Promise<void> {
    const supabase = await this.db(client);
    await handleQueryOrThrow(
      this.leadNotesQuery(supabase)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .is("deleted_at", null),
    );
  }
}

export const notesDbService = new NotesDbService("browser");
export const notesDbServiceServer = new NotesDbService("server");
