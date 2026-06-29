import { NextResponse } from "next/server";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
import { logActivity } from "@/lib/activity/log-activity";
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
  defaultStatus?: string;
  defaultForce?: string;
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

/**
 * Normalize and validate phone number.
 * Handles: 9876543210, +919876543210, 91-9876543210, 9876 543210
 * Also handles Excel scientific notation: 9.87654E+9 → 9876540000
 */
function normalizePhone(phone: string): string {
  let raw = phone.toString().trim();

  // Handle Excel scientific notation (e.g. 9.87654E+9)
  if (/\d+\.?\d*[eE][+\-]?\d+/.test(raw)) {
    const num = Number(raw);
    if (!isNaN(num) && num > 0) raw = Math.round(num).toString();
  }

  // Remove all non-digit and non-plus characters except leading +
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");

  if (hasPlus) {
    return "+" + digits;
  }
  return digits;
}

function validatePhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Remove leading + for digit check
  const digits = normalized.replace(/^\+/, "");
  // Must be 7-15 digits
  if (!/^\d{7,15}$/.test(digits)) return false;
  return true;
}

/** Format phone to +91XXXXXXXXXX for Indian numbers */
function formatIndianPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/^\+/, "");

  // Already has country code 91 (12 digits starting with 91)
  if (digits.length === 12 && digits.startsWith("91")) {
    return "+" + digits;
  }
  // 10-digit Indian mobile number
  if (digits.length === 10) {
    return "+91" + digits;
  }
  // Has + prefix already
  if (normalized.startsWith("+")) {
    return normalized;
  }
  return "+" + digits;
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

  const { leads, assignmentMode, assignedAgentId, selectedAgentIds, defaultStatus, defaultForce } = body;

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

    // ONLY required: at least one of email or phone
    const hasEmail = Boolean(row.email?.trim());
    const hasPhone = Boolean(row.phone?.trim());

    if (!hasEmail && !hasPhone) {
      failCount++;
      errors.push({ row: rowNum, name: rowName, error: "No phone number and no email — at least one is required", field: "email/phone" });
      continue;
    }

    // Validate email format if provided (skip row only if format is truly invalid)
    if (hasEmail && !validateEmail(row.email!.trim())) {
      // Don't fail — just ignore the bad email if phone exists
      if (!hasPhone) {
        failCount++;
        errors.push({ row: rowNum, name: rowName, error: `Invalid email and no phone: ${row.email}`, field: "email" });
        continue;
      }
      // Has phone, skip bad email silently
    }

    // Validate phone format if provided
    if (hasPhone && !validatePhone(row.phone!.trim())) {
      // Don't fail — just ignore bad phone if email exists
      if (!hasEmail) {
        failCount++;
        errors.push({ row: rowNum, name: rowName, error: `Invalid phone and no email: ${row.phone}`, field: "phone" });
        continue;
      }
      // Has email, skip bad phone silently
    }

    // Auto-fill optional fields with defaults
    const leadName = row.fullName?.trim() || "Unknown Lead";
    const leadSource = row.source?.trim() || "Imported";
    const rawStatus = row.status?.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const status: CreateLeadInput["status"] = rawStatus
      ? rawStatus as CreateLeadInput["status"]
      : (defaultStatus || "new") as CreateLeadInput["status"];
    const force = (defaultForce || "standard") as "standard" | "premium" | "enterprise";

    // Determine agent assignment
    let agentId: string | undefined;
    if (assignmentMode === "single" && assignedAgentId) {
      agentId = assignedAgentId;
    } else if (assignmentMode === "round-robin" && agentPool.length > 0) {
      agentId = agentPool[i % agentPool.length];
    }

    // Use validated values only
    const finalEmail = (hasEmail && validateEmail(row.email!.trim())) ? row.email!.trim() : undefined;
    const finalPhone = (hasPhone && validatePhone(row.phone!.trim())) ? formatIndianPhone(row.phone!.trim()) : undefined;

    // === CREATE LEAD ===
    try {
      await leadsService.create({
        fullName: leadName,
        email: finalEmail,
        phone: finalPhone,
        company: row.company?.trim() || undefined,
        source: leadSource,
        status,
        force,
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

  // Log bulk upload activity
  if (successCount > 0) {
    logActivity({
      userId: auth.user.id,
      userName: auth.user.fullName ?? "Admin",
      role: auth.user.role as "admin" | "agent",
      actionType: "bulk_lead_upload",
      actionDescription: `Bulk uploaded ${successCount} leads (${failCount + duplicateCount} failed) from "${assignmentMode}" assignment mode`,
      entityType: "lead",
      metadata: { successCount, failCount, duplicateCount, total: leads.length, assignmentMode },
    });
  }

  return NextResponse.json({
    success: successCount,
    failed: failCount,
    skipped: failCount + duplicateCount,
    duplicates: duplicateCount,
    total: leads.length,
    errors,
  });
}
