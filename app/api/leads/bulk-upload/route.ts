import { NextResponse } from "next/server";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
import { leadsService } from "@/services/leads.service";
import type { CreateLeadInput } from "@/types/lead";

export interface BulkUploadRow {
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status?: string;
}

export interface BulkUploadPayload {
  leads: BulkUploadRow[];
  assignmentMode: "none" | "single" | "round-robin";
  assignedAgentId?: string;
  selectedAgentIds?: string[];
}

const VALID_STATUSES = ["new", "interested", "follow_up", "converted", "not_interested", "closed"];

export async function POST(request: Request) {
  const auth = await requireLeadsAdminApi();
  if (auth.error) return auth.error;

  let body: BulkUploadPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { leads, assignmentMode, assignedAgentId, selectedAgentIds } = body;

  if (!Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json({ error: "No leads provided" }, { status: 400 });
  }

  if (leads.length > 1000) {
    return NextResponse.json({ error: "Maximum 1000 leads per upload" }, { status: 400 });
  }

  // Determine agent assignment list for round-robin
  const agentPool = assignmentMode === "round-robin" && selectedAgentIds?.length
    ? selectedAgentIds
    : [];

  let successCount = 0;
  let failCount = 0;
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < leads.length; i++) {
    const row = leads[i];

    // Validate required fields
    if (!row.fullName?.trim()) {
      failCount++;
      errors.push({ row: i + 1, error: "Name is required" });
      continue;
    }

    if (!row.email?.trim() && !row.phone?.trim()) {
      failCount++;
      errors.push({ row: i + 1, error: "Email or phone is required" });
      continue;
    }

    // Determine agent assignment
    let agentId: string | undefined;
    if (assignmentMode === "single" && assignedAgentId) {
      agentId = assignedAgentId;
    } else if (assignmentMode === "round-robin" && agentPool.length > 0) {
      agentId = agentPool[i % agentPool.length];
    }

    const status = row.status && VALID_STATUSES.includes(row.status)
      ? row.status as CreateLeadInput["status"]
      : "new";

    try {
      await leadsService.create({
        fullName: row.fullName.trim(),
        email: row.email?.trim() || undefined,
        phone: row.phone?.trim() || undefined,
        company: row.company?.trim() || undefined,
        source: row.source?.trim() || undefined,
        status,
        assignedAgentId: agentId,
      });
      successCount++;
    } catch (error) {
      failCount++;
      errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : "Failed to create",
      });
    }
  }

  return NextResponse.json({
    success: successCount,
    failed: failCount,
    total: leads.length,
    errors: errors.slice(0, 20), // Return first 20 errors only
  });
}
