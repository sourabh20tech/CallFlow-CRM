export type CallStatus =
  | "connected"
  | "busy"
  | "no_answer"
  | "callback"
  | "interested"
  | "not_interested";

export type CallDirection = "inbound" | "outbound";

export interface Call {
  id: string;
  leadId: string;
  customerName: string;
  leadPhone?: string;
  agentId?: string;
  agentName?: string;
  direction: CallDirection;
  status: CallStatus;
  duration: number;
  startedAt: string;
  endedAt?: string;
  summary?: string;
  noteCount?: number;
  /** @deprecated Use leadId */
  customerId?: string;
}

export interface CreateCallInput {
  leadId: string;
  direction?: CallDirection;
  status?: CallStatus;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  summary?: string;
  agentId?: string;
}

export interface UpdateCallInput {
  status?: CallStatus;
  durationSeconds?: number;
  endedAt?: string | null;
  summary?: string;
  direction?: CallDirection;
}

export interface CallFilters {
  status?: CallStatus | "all";
  direction?: CallDirection | "all";
  search?: string;
  agentId?: string;
  leadId?: string;
  dateFrom?: string;
  dateTo?: string;
  todayOnly?: boolean;
}

export interface CallStats {
  total: number;
  connected: number;
  callback: number;
  interested: number;
  noAnswer: number;
}
