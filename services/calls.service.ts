import { requireSupabaseConfigured } from "@/lib/supabase/config";
import { EMPTY_CALL_STATS } from "@/lib/db/call-logs-query";
import { toDbError } from "@/lib/db/errors";
import { callLogsDbServiceServer } from "@/services/db/call-logs.service";
import { notesDbServiceServer } from "@/services/db/notes.service";
import type {
  Call,
  CallFilters,
  CallStats,
  CreateCallInput,
  UpdateCallInput,
} from "@/types/call";
import type { CreateNoteInput, Note } from "@/types/note";
import type { PaginatedResult, PaginationParams } from "@/lib/db/pagination";

export class CallsService {
  async list(
    filters?: CallFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<Call>> {
    requireSupabaseConfigured("call log listing");
    try {
      return await callLogsDbServiceServer.list(filters, pagination);
    } catch (error) {
      throw toDbError(error, "Failed to load call logs");
    }
  }

  async listAll(filters?: CallFilters): Promise<Call[]> {
    const result = await this.list(filters, { page: 1, pageSize: 500 });
    return result.data;
  }

  async getById(id: string): Promise<Call | undefined> {
    requireSupabaseConfigured("call details");
    try {
      return await callLogsDbServiceServer.getById(id);
    } catch {
      return undefined;
    }
  }

  async create(input: CreateCallInput): Promise<Call> {
    requireSupabaseConfigured("call creation");
    return callLogsDbServiceServer.create(input);
  }

  async update(id: string, input: UpdateCallInput): Promise<Call> {
    requireSupabaseConfigured("call update");
    return callLogsDbServiceServer.update(id, input);
  }

  async updateStatus(id: string, status: Call["status"]): Promise<Call> {
    requireSupabaseConfigured("call status update");
    return callLogsDbServiceServer.updateStatus(id, status);
  }

  async delete(id: string): Promise<void> {
    requireSupabaseConfigured("call deletion");
    await callLogsDbServiceServer.softDelete(id);
  }

  /** One-click outbound call log entry */
  async initiateCall(leadId: string): Promise<Call> {
    return this.create({
      leadId,
      direction: "outbound",
      status: "connected",
      startedAt: new Date().toISOString(),
    });
  }

  async getNotes(callId: string): Promise<Note[]> {
    requireSupabaseConfigured("call notes");
    return notesDbServiceServer.listByCallLog(callId);
  }

  async addNote(callId: string, content: string, leadId?: string): Promise<Note> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error("Note content is required");
    }

    const resolvedLeadId = leadId ?? (await this.getById(callId))?.leadId;
    if (!resolvedLeadId) {
      throw new Error("Lead not found for this call");
    }

    const input: CreateNoteInput = {
      callLogId: callId,
      leadId: resolvedLeadId,
      content: trimmed,
    };

    requireSupabaseConfigured("call note creation");
    return notesDbServiceServer.create(input);
  }

  async getStats(filters?: CallFilters): Promise<CallStats> {
    requireSupabaseConfigured("call stats");
    return callLogsDbServiceServer.getStatsSafe(filters);
  }
}

export const callsService = new CallsService();
