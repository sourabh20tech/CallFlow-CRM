import { NextResponse } from "next/server";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
import { logActivity } from "@/lib/activity/log-activity";
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

// ─── Validation Helpers (unchanged logic) ────────────────────────────────────

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone: string): string {
  let raw = phone.toString().trim();
  if (/\d+\.?\d*[eE][+\-]?\d+/.test(raw)) {
    const num = Number(raw);
    if (!isNaN(num) && num > 0) raw = Math.round(num).toString();
  }
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return hasPlus ? "+" + digits : digits;
}

function validatePhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/^\+/, "");
  return /^\d{7,15}$/.test(digits);
}

function formatIndianPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/^\+/, "");
  if (digits.length === 12 && digits.startsWith("91")) return "+" + digits;
  if (digits.length === 10) return "+91" + digits;
  if (normalized.startsWith("+")) return normalized;
  return "+" + digits;
}

// ─── Bulk Insert Size ────────────────────────────────────────────────────────

const DB_BATCH_SIZE = 200; // rows per INSERT statement

// ─── Main Handler ────────────────────────────────────────────────────────────

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

  // ─── Agent validation (one query) ───────────────────────────────────────────

  let validAgentIds: Set<string> = new Set();
  if (assignmentMode === "single" || assignmentMode === "round-robin") {
    try {
      const { leadsService } = await import("@/services/leads.service");
      const rosterAgents = await leadsService.getRosterAgents();
      validAgentIds = new Set(rosterAgents.map((a) => a.id));
    } catch { /* proceed without validation */ }

    if (assignmentMode === "single" && assignedAgentId && !validAgentIds.has(assignedAgentId)) {
      return NextResponse.json({
        error: `Invalid agent ID: ${assignedAgentId}. Agent does not exist.`,
      }, { status: 400 });
    }
  }

  const agentPool = assignmentMode === "round-robin" && selectedAgentIds?.length
    ? selectedAgentIds.filter((id) => validAgentIds.size === 0 || validAgentIds.has(id))
    : [];

  // ─── Phase 1: Validate all rows in memory (zero DB calls) ──────────────────

  interface ValidatedLead {
    rowNum: number;
    insert: {
      full_name: string;
      email: string | null;
      phone: string | null;
      company: string | null;
      tier: string;
      status: string;
      source: string | null;
      assigned_agent_id: string | null;
      created_by: string;
      converted_at: string | null;
      next_follow_up_at: string | null;
    };
  }

  const validated: ValidatedLead[] = [];
  const errors: RowError[] = [];
  let failCount = 0;

  for (let i = 0; i < leads.length; i++) {
    const row = leads[i];
    const rowNum = i + 1;
    const rowName = row.fullName?.trim() || `Row ${rowNum}`;

    const hasEmail = Boolean(row.email?.trim());
    const hasPhone = Boolean(row.phone?.trim());

    if (!hasEmail && !hasPhone) {
      failCount++;
      errors.push({ row: rowNum, name: rowName, error: "No phone number and no email — at least one is required", field: "email/phone" });
      continue;
    }

    if (hasEmail && !validateEmail(row.email!.trim())) {
      if (!hasPhone) {
        failCount++;
        errors.push({ row: rowNum, name: rowName, error: `Invalid email and no phone: ${row.email}`, field: "email" });
        continue;
      }
    }

    if (hasPhone && !validatePhone(row.phone!.trim())) {
      if (!hasEmail) {
        failCount++;
        errors.push({ row: rowNum, name: rowName, error: `Invalid phone and no email: ${row.phone}`, field: "phone" });
        continue;
      }
    }

    const leadName = row.fullName?.trim() || "Unknown Lead";
    const leadSource = row.source?.trim() || "Imported";
    const rawStatus = row.status?.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const status = rawStatus || defaultStatus || "new";
    const force = defaultForce || "standard";

    let agentId: string | null = null;
    if (assignmentMode === "single" && assignedAgentId) {
      agentId = assignedAgentId;
    } else if (assignmentMode === "round-robin" && agentPool.length > 0) {
      agentId = agentPool[i % agentPool.length];
    }

    const finalEmail = (hasEmail && validateEmail(row.email!.trim())) ? row.email!.trim().toLowerCase() : null;
    const finalPhone = (hasPhone && validatePhone(row.phone!.trim())) ? formatIndianPhone(row.phone!.trim()) : null;

    validated.push({
      rowNum,
      insert: {
        full_name: leadName,
        email: finalEmail,
        phone: finalPhone,
        company: row.company?.trim() || null,
        tier: force,
        status,
        source: leadSource,
        assigned_agent_id: agentId,
        created_by: auth.user.id,
        converted_at: status === "converted" ? new Date().toISOString() : null,
        next_follow_up_at: null,
      },
    });
  }

  // ─── Phase 2: Bulk duplicate detection (ONE query) ─────────────────────────

  const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
  const { createClient } = await import("@/lib/supabase/server");

  // Use admin client to bypass RLS for bulk ops (auth already verified above)
  const supabase = isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();

  // Collect all emails and phones to check
  const emailsToCheck = validated
    .map((v) => v.insert.email)
    .filter((e): e is string => e !== null);
  const phonesToCheck = validated
    .map((v) => v.insert.phone)
    .filter((p): p is string => p !== null);

  // Fetch existing emails + phones in parallel (max 2 queries instead of N)
  const existingEmails = new Set<string>();
  const existingPhones = new Set<string>();

  const dupCheckPromises: Promise<void>[] = [];

  if (emailsToCheck.length > 0) {
    dupCheckPromises.push(
      (async () => {
        // Supabase `in` supports up to ~1000 values; chunk if needed
        for (let i = 0; i < emailsToCheck.length; i += 500) {
          const chunk = emailsToCheck.slice(i, i + 500);
          const { data } = await (supabase as any)
            .from("leads")
            .select("email")
            .is("deleted_at", null)
            .in("email", chunk);
          if (data) {
            for (const row of data) {
              if (row.email) existingEmails.add(row.email.toLowerCase());
            }
          }
        }
      })(),
    );
  }

  if (phonesToCheck.length > 0) {
    dupCheckPromises.push(
      (async () => {
        for (let i = 0; i < phonesToCheck.length; i += 500) {
          const chunk = phonesToCheck.slice(i, i + 500);
          const { data } = await (supabase as any)
            .from("leads")
            .select("phone")
            .is("deleted_at", null)
            .in("phone", chunk);
          if (data) {
            for (const row of data) {
              if (row.phone) existingPhones.add(row.phone);
            }
          }
        }
      })(),
    );
  }

  await Promise.all(dupCheckPromises);

  // ─── Phase 3: Filter duplicates in-memory ──────────────────────────────────

  let duplicateCount = 0;
  const toInsert: ValidatedLead[] = [];
  // Track within-batch duplicates too
  const batchEmails = new Set<string>();
  const batchPhones = new Set<string>();

  for (const item of validated) {
    const email = item.insert.email;
    const phone = item.insert.phone;

    // Check against existing DB records
    const emailDup = email && existingEmails.has(email.toLowerCase());
    const phoneDup = phone && existingPhones.has(phone);

    // Check against other rows in this batch (prevent intra-batch duplicates)
    const batchEmailDup = email && batchEmails.has(email.toLowerCase());
    const batchPhoneDup = phone && batchPhones.has(phone);

    if (emailDup || phoneDup || batchEmailDup || batchPhoneDup) {
      duplicateCount++;
      const rowName = item.insert.full_name || `Row ${item.rowNum}`;
      errors.push({
        row: item.rowNum,
        name: rowName,
        error: "Duplicate entry (email or phone already exists)",
        field: "duplicate",
      });
      continue;
    }

    // Track for intra-batch dedup
    if (email) batchEmails.add(email.toLowerCase());
    if (phone) batchPhones.add(phone);
    toInsert.push(item);
  }

  // ─── Phase 4: Bulk INSERT in batches of DB_BATCH_SIZE ──────────────────────

  let successCount = 0;

  for (let i = 0; i < toInsert.length; i += DB_BATCH_SIZE) {
    const batch = toInsert.slice(i, i + DB_BATCH_SIZE);
    const rows = batch.map((b) => b.insert);

    const { data, error } = await (supabase as any)
      .from("leads")
      .insert(rows)
      .select("id");

    if (error) {
      // If the batch insert fails entirely (rare), fall back to individual inserts
      // This handles edge cases like partial unique constraint violations
      for (const item of batch) {
        const { error: singleErr } = await (supabase as any)
          .from("leads")
          .insert(item.insert)
          .select("id");

        if (singleErr) {
          const msg = singleErr.message ?? "Failed to create";
          const isDuplicate = msg.toLowerCase().includes("duplicate") ||
            msg.toLowerCase().includes("unique") ||
            msg.toLowerCase().includes("already exists") ||
            msg.toLowerCase().includes("violates unique");

          if (isDuplicate) {
            duplicateCount++;
            errors.push({
              row: item.rowNum,
              name: item.insert.full_name,
              error: "Duplicate entry (email or phone already exists)",
              field: "duplicate",
            });
          } else {
            failCount++;
            errors.push({
              row: item.rowNum,
              name: item.insert.full_name,
              error: msg,
              field: "database",
            });
          }
        } else {
          successCount++;
        }
      }
    } else {
      // Batch succeeded — count all rows
      successCount += data?.length ?? batch.length;
    }
  }

  // ─── Phase 5: Activity log (one call) ──────────────────────────────────────

  if (errors.length > 0) {
    console.warn(`[bulk-upload] ${errors.length} errors out of ${leads.length} rows:`,
      errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.error}`).join("; "),
    );
  }

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
