import type {
  AgentRow,
  AgentWithProfile,
  CallLogRow,
  CallLogWithRelations,
  FollowupRow,
  FollowupWithRelations,
  LeadRow,
  LeadWithAgent,
  NoteRow,
  NoteWithAuthor,
  ProfileRow,
} from "@/types/database";
import type { Agent } from "@/types/agent";
import type { Call } from "@/types/call";
import type { Followup } from "@/types/followup";
import type { Lead } from "@/types/lead";
import type { Note } from "@/types/note";

export function mapLeadRow(row: LeadRow | LeadWithAgent): Lead {
  const withAgent = row as LeadWithAgent;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    company: row.company ?? undefined,
    force: row.tier,
    status: row.status,
    source: row.source ?? undefined,
    assignedAgentId: row.assigned_agent_id ?? undefined,
    assignedAgentName: withAgent.agents?.profiles?.full_name ?? undefined,
    createdBy: row.created_by ?? undefined,
    convertedAt: row.converted_at ?? undefined,
    lastContactedAt: row.last_contacted_at ?? undefined,
    nextFollowUpAt: row.next_follow_up_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAgentRow(
  row: AgentRow | AgentWithProfile,
  extras?: { assignedLeadsCount?: number },
): Agent {
  const profile = "profiles" in row ? row.profiles : null;
  return {
    id: row.id,
    profileId: row.profile_id,
    name: profile?.full_name ?? "Agent",
    email: profile?.email ?? "",
    phone: profile?.phone ?? undefined,
    status: row.status,
    department: row.department,
    callsHandled: row.calls_handled,
    avgHandleTime: row.avg_handle_time_seconds,
    satisfaction: Number(row.satisfaction_score ?? 0),
    isActive: row.is_active,
    avatarUrl: profile?.avatar_url ?? undefined,
    assignedLeadsCount: extras?.assignedLeadsCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAgentToUpdate(input: import("@/types/agent").UpdateAgentInput) {
  return {
    department: input.department,
    status: input.status,
    is_active: input.isActive,
    calls_handled: input.callsHandled,
    avg_handle_time_seconds: input.avgHandleTime,
    satisfaction_score: input.satisfaction,
  };
}

export function mapCallLogRow(
  row: CallLogRow | CallLogWithRelations,
  extras?: { noteCount?: number },
): Call {
  const withRel = row as CallLogWithRelations & {
    leads?: { id: string; full_name: string; phone?: string | null; email?: string | null };
  };
  return {
    id: row.id,
    leadId: row.lead_id,
    customerId: row.lead_id,
    customerName: withRel.leads?.full_name ?? "Unknown",
    leadPhone: withRel.leads?.phone ?? undefined,
    agentId: row.agent_id ?? undefined,
    agentName: withRel.agents?.profiles?.full_name ?? undefined,
    direction: row.direction,
    status: row.status,
    duration: row.duration_seconds,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    summary: row.summary ?? undefined,
    noteCount: extras?.noteCount,
  };
}

export function mapCallToInsert(
  input: import("@/types/call").CreateCallInput,
  agentId: string | null,
  userId: string,
) {
  return {
    lead_id: input.leadId,
    agent_id: agentId,
    direction: input.direction ?? "outbound",
    status: input.status ?? "callback",
    duration_seconds: input.durationSeconds ?? 0,
    started_at: input.startedAt ?? new Date().toISOString(),
    ended_at: input.endedAt ?? null,
    summary: input.summary ?? null,
    created_by: userId,
  };
}

export function mapCallToUpdate(input: import("@/types/call").UpdateCallInput) {
  return {
    status: input.status,
    duration_seconds: input.durationSeconds,
    ended_at: input.endedAt,
    summary: input.summary,
    direction: input.direction,
  };
}

export function mapFollowupRow(row: FollowupRow | FollowupWithRelations): Followup {
  const withRel = row as FollowupWithRelations;
  return {
    id: row.id,
    leadId: row.lead_id,
    leadName: withRel.leads?.full_name,
    assignedAgentId: row.assigned_agent_id ?? undefined,
    assignedAgentName: withRel.agents?.profiles?.full_name ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    dueAt: row.due_at,
    status: row.status,
    priority: row.priority,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapNoteRow(row: NoteRow | NoteWithAuthor): Note {
  const withAuthor = row as NoteWithAuthor;
  return {
    id: row.id,
    leadId: row.lead_id ?? undefined,
    callLogId: row.call_log_id ?? undefined,
    followupId: row.followup_id ?? undefined,
    authorId: row.author_id,
    authorName: withAuthor.profiles?.full_name ?? undefined,
    authorAvatarUrl: withAuthor.profiles?.avatar_url ?? undefined,
    content: row.content,
    noteType: (row as NoteRow & { note_type?: string }).note_type === "internal" ? "internal" : "public",
    visibility: (row as any).visibility === "shared" ? "shared" : "private",
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLeadToInsert(
  input: import("@/types/lead").CreateLeadInput,
  createdBy: string,
): import("@/types/database").LeadInsert {
  return {
    full_name: input.fullName,
    email: input.email ?? null,
    phone: input.phone ?? null,
    company: input.company ?? null,
    tier: input.force ?? "standard",
    status: input.status ?? "new",
    source: input.source ?? null,
    assigned_agent_id: input.assignedAgentId ?? null,
    created_by: createdBy,
    converted_at: input.status === "converted" ? new Date().toISOString() : null,
    next_follow_up_at: input.nextFollowUpAt ?? null,
  };
}

export function mapLeadToUpdate(
  input: import("@/types/lead").UpdateLeadInput,
): import("@/types/database").LeadUpdate {
  return {
    full_name: input.fullName,
    email: input.email,
    phone: input.phone,
    company: input.company,
    tier: input.force,
    status: input.status,
    source: input.source,
    assigned_agent_id:
      input.assignedAgentId === undefined ? undefined : input.assignedAgentId ?? null,
    converted_at: input.convertedAt,
    last_contacted_at: input.lastContactedAt,
    next_follow_up_at: input.nextFollowUpAt,
  };
}

export function pickProfile(row: ProfileRow | null | undefined) {
  if (!row) return null;
  return {
    email: row.email,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
  };
}
