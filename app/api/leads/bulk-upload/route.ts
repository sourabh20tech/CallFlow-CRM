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

interface RowError {
  row: number;
  name: string;
  error: string;
  field?: string;
}

const VALID_STATUSES = ["new", "interested", "follow_up", "converted", "not_interested", "closed"];

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  // Accept digits, spaces, dashes, plus, parentheses — minimum 7 chars
  const cleaned = phone.replace(/[\s\-\(\)\+\.]/g, "");
  return /^\d{7,15}$/.test(cleaned);
}

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

  // Validate agent IDs exist if assignment is requested
  let validAgentIds: Set<string> = new Set();
  if (assignmentMode === "single" || assignmentMode === "round-robin") {
    try {
      const rosterAgents = await leadsService.getRosterAgents();
      validAgentIds = new Set(rosterAgents.map((a) => a.id));
    } catch {
      // If we can't validate agents, proceed without assignment
    }

    if (assignmentMode === "single" && assignedAgentId && !validAgentIds.has(assignedAgentId)) {
      return NextResponse.json({
        error: `Invalid agent ID: ${assignedAgentId}. Agent does not exist.`,
      }, { status: 400 });
    }
  }

  // Determine agent assignment list for round-robin
  const agentPool = assignmentMode === "round-robin" && selectedAgentIds?.length
    ? selectedAgentIds.filter((id) => validAgentIds.size === 0 || validAgentIds.has(id))
    : [];

  let successCount = 0;
  let failCount = 0;
  let duplicateCount = 0;
  const errors: RowError[] = [];

  for (let i = 0; i < leads.length; i++) {
    const row = leads[i];
    const rowNum = i + 1;
    const rowName = row.fullName?.trim() || `Row ${rowNum}`;

    // === VALIDATION ===

    // Check name
    if (!row.fullName?.trim()) {
      failCount++;
      errors.push({ row: rowNum, name: rowName, error: "Name is required", field: "name" });
      continue;
    }

    // Check email or phone exists
    const hasEmail = Boolean(row.email?.trim());
    const hasPhone = Boolean(row.phone?.trim());

    if (!hasEmail && !hasPhone) {
      failCount++;
      errors.push({ row: rowNum, name: rowName, error: "Email or phone is required", field: "email/phone" });
      continue;
    }

    // Validate email format if provided
    if (hasEmail && !validateEmail(row.email!.trim())) {
      failCount++;
      errors.push({ row: rowNum, name: rowName, error: `Invalid email: ${row.email}`, field: "email" });
      continue;
    }

    // Validate phone format if provided
    if (hasPhone && !validatePhone(row.phone!.trim())) {
      failCount++;
      errors.push({ row: rowNum, name: rowName, error: `Invalid phone: ${row.phone}`, field: "phone" });
      continue;
    }

    // Validate status if provided
    const rawStatus = row.status?.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const status: CreateLeadInput["status"] = rawStatus && VALID_STATUSES.includes(rawStatus)
      ? rawStatus as CreateLeadInput["status"]
      : "new";

    // Determine agent assignment
    let agentId: string | undefined;
    if (assignmentMode === "single" && assignedAgentId) {
      agentId = assignedAgentId;
    } else if (assignmentMode === "round-robin" && agentPool.length > 0) {
      agentId = agentPool[i % agentPool.length];
    }

    // === CREATE LEAD ===
    try {
      await leadsService.create({
        fullName: row.fullName.trim(),
        email: hasEmail ? row.email!.trim() : undefined,
        phone: hasPhone ? row.phone!.trim() : undefined,
        company: row.company?.trim() || undefined,
        source: row.source?.trim() || undefined,
        status,
        assignedAgentId: agentId,
      });
      successCount++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create";
      const isDuplicate = message.toLowerCase().includes("duplicate") ||
        message.toLowerCase().includes("unique") ||
        message.toLowerCase().includes("already exists") ||
        message.toLowerCase().includes("violates unique");

      if (isDuplicate) {
        duplicateCount++;
        errors.push({ row: rowNum, name: rowName, error: "Duplicate entry (email or phone already exists)", field: "duplicate" });
      } else {
        failCount++;
        errors.push({ row: rowNum, name: rowName, error: message, field: "database" });
      }
    }
  }

  // Log errors server-side for debugging
  if (errors.length > 0) {
    console.warn(`[bulk-upload] ${errors.length} errors out of ${leads.length} rows:`,
      errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.error}`).join("; "),
    );
  }

  return NextResponse.json({
    success: successCount,
    failed: failCount,
    duplicates: duplicateCount,
    total: leads.length,
    errors, // Return ALL errors (frontend will handle display)
  });
}
