import { mockCalls } from "@/lib/data/mock";
import type { Call, CallStatus, CreateCallInput, UpdateCallInput } from "@/types/call";
import type { Note } from "@/types/note";

let demoCalls: Call[] = mockCalls.map((c) => ({
  ...c,
  leadId: c.customerId ?? c.leadId ?? "cust-1",
  leadPhone: "+1 (555) 000-0000",
}));

const demoNotesByCall: Record<string, Note[]> = {
  "call-1": [
    {
      id: "note-c1",
      callLogId: "call-1",
      authorId: "demo-agent",
      authorName: "Alex Morgan",
      content: "Discussed enterprise pricing tier.",
      isPinned: true, noteType: "public" as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ],
};

export function getDemoCalls(): Call[] {
  return demoCalls.map((c) => ({
    ...c,
    noteCount: demoNotesByCall[c.id]?.length ?? 0,
  }));
}

export function getDemoCallById(id: string): Call | undefined {
  const call = demoCalls.find((c) => c.id === id);
  if (!call) return undefined;
  return { ...call, noteCount: demoNotesByCall[id]?.length ?? 0 };
}

export function createDemoCall(
  input: CreateCallInput,
  extras?: { customerName?: string; leadPhone?: string; agentName?: string },
): Call {
  const id = `call-${Date.now()}`;
  const call: Call = {
    id,
    leadId: input.leadId,
    customerId: input.leadId,
    customerName: extras?.customerName ?? "Lead",
    leadPhone: extras?.leadPhone,
    direction: input.direction ?? "outbound",
    status: input.status ?? "callback",
    duration: input.durationSeconds ?? 0,
    startedAt: input.startedAt ?? new Date().toISOString(),
    endedAt: input.endedAt,
    summary: input.summary,
    agentName: extras?.agentName ?? "Demo Agent",
    noteCount: 0,
  };
  demoCalls = [call, ...demoCalls];
  return call;
}

export function updateDemoCall(id: string, input: UpdateCallInput): Call | undefined {
  const index = demoCalls.findIndex((c) => c.id === id);
  if (index === -1) return undefined;
  const current = demoCalls[index]!;
  const updated: Call = {
    ...current,
    status: input.status ?? current.status,
    duration: input.durationSeconds ?? current.duration,
    endedAt: input.endedAt === null ? undefined : (input.endedAt ?? current.endedAt),
    summary: input.summary ?? current.summary,
    direction: input.direction ?? current.direction,
  };
  demoCalls = [...demoCalls.slice(0, index), updated, ...demoCalls.slice(index + 1)];
  return { ...updated, noteCount: demoNotesByCall[id]?.length ?? 0 };
}

export function getDemoCallNotes(callId: string): Note[] {
  return demoNotesByCall[callId] ?? [];
}

export function addDemoCallNote(callId: string, content: string, authorName = "You"): Note {
  const note: Note = {
    id: `note-${Date.now()}`,
    callLogId: callId,
    authorId: "demo-user",
    authorName,
    content,
    isPinned: false, noteType: "public" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoNotesByCall[callId] = [note, ...(demoNotesByCall[callId] ?? [])];
  return note;
}

import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationParams,
} from "@/lib/db/pagination";

export function paginateDemoCalls(
  calls: Call[],
  pagination?: PaginationParams,
): PaginatedResult<Call> {
  const { page, pageSize, from } = normalizePagination(pagination);
  const slice = calls.slice(from, from + pageSize);
  return buildPaginatedResult(slice, calls.length, page, pageSize);
}

export function getDemoCallStats(
  filters?: Parameters<typeof filterDemoCalls>[0],
): import("@/types/call").CallStats {
  const list = filterDemoCalls(filters);
  return {
    total: list.length,
    connected: list.filter((c) => c.status === "connected").length,
    callback: list.filter((c) => c.status === "callback").length,
    interested: list.filter((c) => c.status === "interested").length,
    noAnswer: list.filter((c) => c.status === "no_answer").length,
  };
}

export function deleteDemoCall(id: string): void {
  demoCalls = demoCalls.filter((c) => c.id !== id);
  delete demoNotesByCall[id];
}

export function filterDemoCalls(filters?: {
  status?: CallStatus | "all";
  direction?: Call["direction"] | "all";
  search?: string;
  agentId?: string;
  leadId?: string;
  dateFrom?: string;
  dateTo?: string;
  todayOnly?: boolean;
}): Call[] {
  let result = getDemoCalls();
  if (filters?.agentId) {
    result = result.filter((c) => c.agentId === filters.agentId);
  }
  if (filters?.todayOnly) {
    const now = new Date();
    result = result.filter((c) => {
      const d = new Date(c.startedAt);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });
  }
  if (filters?.status && filters.status !== "all") {
    result = result.filter((c) => c.status === filters.status);
  }
  if (filters?.direction && filters.direction !== "all") {
    result = result.filter((c) => c.direction === filters.direction);
  }
  if (filters?.leadId) {
    result = result.filter((c) => c.leadId === filters.leadId);
  }
  if (filters?.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    result = result.filter((c) => new Date(c.startedAt).getTime() >= from);
  }
  if (filters?.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    result = result.filter((c) => new Date(c.startedAt).getTime() <= to);
  }
  if (filters?.search?.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.agentName?.toLowerCase().includes(q) ||
        c.summary?.toLowerCase().includes(q),
    );
  }
  return result;
}
