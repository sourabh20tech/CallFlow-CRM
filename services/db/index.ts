export { BaseDbService, resolveDbClient } from "@/services/db/base.service";
export { LeadsDbService, leadsDbService, leadsDbServiceServer } from "@/services/db/leads.service";
export {
  AgentsDbService,
  agentsDbService,
  agentsDbServiceServer,
} from "@/services/db/agents.service";
export {
  CallLogsDbService,
  callLogsDbService,
  callLogsDbServiceServer,
} from "@/services/db/call-logs.service";
export {
  FollowupsDbService,
  followupsDbService,
  followupsDbServiceServer,
} from "@/services/db/followups.service";
export { NotesDbService, notesDbService, notesDbServiceServer } from "@/services/db/notes.service";
export {
  SystemSettingsDbService,
  systemSettingsDbService,
  systemSettingsDbServiceServer,
} from "@/services/db/system-settings.service";
export {
  AnalyticsDbService,
  analyticsDbService,
  analyticsDbServiceServer,
} from "@/services/db/analytics.service";

export type { LeadFilters } from "@/services/db/leads.service";
export type { CreateCallInput } from "@/types/call";
