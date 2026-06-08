export type ActivityActionType =
  | "login"
  | "logout"
  | "password_change"
  | "lead_created"
  | "lead_updated"
  | "lead_deleted"
  | "lead_assigned"
  | "lead_status_changed"
  | "bulk_lead_upload"
  | "call_logged"
  | "call_updated"
  | "followup_created"
  | "followup_updated"
  | "followup_completed"
  | "note_added"
  | "note_edited"
  | "note_deleted"
  | "agent_created"
  | "agent_updated"
  | "agent_deactivated";

export type ActivityEntityType =
  | "lead"
  | "call"
  | "followup"
  | "note"
  | "agent"
  | "user";

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  role: "admin" | "agent";
  actionType: ActivityActionType;
  actionDescription: string;
  entityType?: ActivityEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityLogFilters {
  userId?: string;
  role?: "admin" | "agent";
  actionType?: ActivityActionType;
  entityType?: ActivityEntityType;
  entityId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface LogActivityInput {
  userId: string;
  userName: string;
  role: "admin" | "agent";
  actionType: ActivityActionType;
  actionDescription: string;
  entityType?: ActivityEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
}
