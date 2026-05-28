import type { Call } from "@/types/call";
import type { Followup } from "@/types/followup";
import type { Lead } from "@/types/lead";
import type { Note } from "@/types/note";
import type { AdminAnnouncement } from "@/types/system";

export interface AgentPanelStats {
  assignedLeads: number;
  callsToday: number;
  pendingFollowups: number;
  convertedLeads: number;
  activeCalls: number;
}

export interface AgentPanelLead extends Lead {
  noteCount: number;
}

export interface AgentPanelBundle {
  agentId: string;
  agentName: string;
  stats: AgentPanelStats;
  announcement: AdminAnnouncement;
  myLeads: AgentPanelLead[];
  convertedLeads: AgentPanelLead[];
  todayCalls: Call[];
  pendingFollowups: Followup[];
  dialLeads: { id: string; name: string; phone?: string; company?: string }[];
  generatedAt: string;
}

export interface UpdateLeadStatusBody {
  status: Lead["status"];
}

export interface CreateLeadNoteBody {
  content: string;
}

export type LeadNotesResponse = { notes: Note[] };
