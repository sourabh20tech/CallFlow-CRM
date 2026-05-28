import { FOLLOWUPS_TABLE_NAME } from "@/lib/followups/constants";

export const TABLES = {
  CALL_LOGS: "call_logs",
  FOLLOW_UPS: FOLLOWUPS_TABLE_NAME,
  LEADS: "leads",
  AGENTS: "agents",
  LEAD_NOTES: "lead_notes",
} as const;

export type FollowUpsTableName = typeof TABLES.FOLLOW_UPS;
