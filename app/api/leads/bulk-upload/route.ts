import { NextResponse } from "next/server";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
import { logActivity } from "@/lib/activity/log-activity";

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
  originalPhone?: string;
  normalizedPhone?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE PHONE NORMALIZATION
// Handles: 9876543210, +919876543210, 919876543210, 09876543210,
//   p:+919876543210, P:9876543210, 91 9876543210, +91 9876543210,
//   98765 43210, 98765-43210, (9876543210), +91-9876543210, +91 (9876543210)
//   Excel scientific notation: 9.87654E+9
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normalize phone to bare 10-digit Indian mobile number.
 * Returns the 10 digits ONLY (no +91, no prefix).
 * Returns null if cannot be normalized to valid 10 digits.
 */
function normalizePhoneToDigits(raw: string): string | null {
  let phone = raw.toString().trim();

  // Handle Excel scientific notation (e.g. 9.87654E+9)
  if (/\d+\.?\d*[eE][+\-]?\d+/.test(phone)) {
    const num = Number(phone);
    if (!isNaN(num) && num > 0) phone = Math.round(num).toString();
  }

  // Strip p: or P: prefix
  phone = phone.replace(/^[pP]\s*:\s*/, "");

  // Remove ALL non-digit characters (spaces, hyphens, brackets, +, etc.)
  const digits = phone.replace(/\D/g, "");

  // Now extract the 10-digit mobile number
  if (digits.length === 10) {
    return digits;
  }
  // 11 digits starting with 0 (trunk prefix)
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  // 12 digits starting with 91 (country code)
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  // 13 digits starting with 091
  if (digits.length === 13 && digits.startsWith("091")) {
    return digits.slice(3);
  }

  // Fallback: if 7-15 digits, return as-is (international)
  if (digits.length >= 7 && digits.length <= 15) {
    return digits;
  }

  return null;
}

/**
 * Validate that normalized digits represent a valid Indian mobile number.
 */
function isValidIndianMobile(digits: string): boolean {
  if (digits.length !== 10) return false;
  // Must start with 6, 7, 8, or 9
  if (!/^[6-9]/.test(digits)) return false;
  // Reject obvious fakes (all same digit, sequential)
  if (/^(.)\1{9}$/.test(digits)) return false; // 1111111111, 0000000000
  if (digits === "1234567890") return false;
  return true;
}

/**
 * Format to storage format: +91XXXXXXXXXX
 */
function formatToStorage(digits: string): string {
  if (digits.length === 10) return "+91" + digits;
  // International: store with + prefix
  return "+" + digits;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ═══════════════════════════════════════════════════════════════════════════════

const DB_BATCH_SIZE = 200;

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

  // ─── Phase 1: Validate & normalize all rows in memory ──────────────────────

  interface ValidatedLead {
    rowNum: number;
    normalizedPhone: string | null; // bare 10 digits for dedup
    normalizedEmail: string | null; // lowercase trimmed
    insert: {
      full_name: string;
      email: string | null;
      phone: string | null; // +91XXXXXXXXXX storage format
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

    const rawPhone = row.phone?.trim() ?? "";
    const rawEmail = row.email?.trim() ?? "";
    const hasPhone = rawPhone.length > 0;
    const hasEmail = rawEmail.length > 0;

    if (!hasEmail && !hasPhone) {
      failCount++;
      errors.push({ row: rowNum, name: rowName, error: "No phone and no email — at least one required", field: "email/phone" });
      continue;
    }

    // Normalize phone
    let phoneDigits: string | null = null;
    let phoneValid = false;
    if (hasPhone) {
      phoneDigits = normalizePhoneToDigits(rawPhone);
      if (phoneDigits && isValidIndianMobile(phoneDigits)) {
        phoneValid = true;
      } else if (phoneDigits && phoneDigits.length >= 7 && phoneDigits.length <= 15) {
        // Accept international numbers too (non-Indian)
        phoneValid = true;
      } else {
        phoneDigits = null;
      }
    }

    // Normalize email
    let emailNorm: string | null = null;
    let emailValid = false;
    if (hasEmail) {
      emailNorm = normalizeEmail(rawEmail);
      emailValid = validateEmail(emailNorm);
      if (!emailValid) emailNorm = null;
    }

    // Must have at least one valid contact
    if (!phoneValid && !emailValid) {
      failCount++;
      const reason = hasPhone
        ? `Invalid phone: ${rawPhone}`
        : `Invalid email: ${rawEmail}`;
      errors.push({ row: rowNum, name: rowName, error: reason, field: hasPhone ? "phone" : "email", originalPhone: rawPhone, normalizedPhone: phoneDigits ?? "" });
      continue;
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

    // Storage format for phone: +91XXXXXXXXXX
    const storagePhone = phoneValid && phoneDigits ? formatToStorage(phoneDigits) : null;

    validated.push({
      rowNum,
      normalizedPhone: phoneDigits, // bare digits for dedup
      normalizedEmail: emailNorm,
      insert: {
        full_name: leadName,
        email: emailNorm,
        phone: storagePhone,
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

  // ─── Phase 2: File-level duplicate detection (within uploaded file) ─────────

  let duplicateCount = 0;
  const filePhones = new Set<string>(); // normalized digits
  const fileEmails = new Set<string>(); // lowercase
  const dedupedInFile: ValidatedLead[] = [];

  for (const item of validated) {
    const phone = item.normalizedPhone;
    const email = item.normalizedEmail;

    // Check within-file duplicates (first occurrence wins)
    if (phone && filePhones.has(phone)) {
      duplicateCount++;
      errors.push({
        row: item.rowNum,
        name: item.insert.full_name,
        error: "Duplicate within uploaded file (same phone number)",
        field: "duplicate",
        originalPhone: phone,
        normalizedPhone: phone,
      });
      continue;
    }
    if (email && fileEmails.has(email)) {
      duplicateCount++;
      errors.push({
        row: item.rowNum,
        name: item.insert.full_name,
        error: "Duplicate within uploaded file (same email)",
        field: "duplicate",
      });
      continue;
    }

    if (phone) filePhones.add(phone);
    if (email) fileEmails.add(email);
    dedupedInFile.push(item);
  }

  // ─── Phase 3: Database duplicate detection (bulk query) ────────────────────

  const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();

  // Load existing phones from DB — we need to normalize them for comparison
  // DB stores as +91XXXXXXXXXX, so extract last 10 digits for comparison
  const existingPhoneDigits = new Set<string>();
  const existingEmails = new Set<string>();

  const phonesToCheck = [...filePhones]; // unique phones from file
  const emailsToCheck = [...fileEmails]; // unique emails from file

  const dupPromises: Promise<void>[] = [];

  if (phonesToCheck.length > 0) {
    dupPromises.push(
      (async () => {
        // Build all possible stored formats for these numbers
        const storedFormats: string[] = [];
        for (const digits of phonesToCheck) {
          if (digits.length === 10) {
            storedFormats.push("+91" + digits);
            storedFormats.push("91" + digits);
            storedFormats.push(digits);
          } else {
            storedFormats.push("+" + digits);
            storedFormats.push(digits);
          }
        }

        // Query in chunks of 500
        for (let i = 0; i < storedFormats.length; i += 500) {
          const chunk = storedFormats.slice(i, i + 500);
          const { data } = await (supabase as any)
            .from("leads")
            .select("phone")
            .is("deleted_at", null)
            .in("phone", chunk);
          if (data) {
            for (const row of data) {
              if (row.phone) {
                // Normalize DB phone to bare digits for comparison
                const dbDigits = normalizePhoneToDigits(row.phone);
                if (dbDigits) existingPhoneDigits.add(dbDigits);
              }
            }
          }
        }
      })(),
    );
  }

  if (emailsToCheck.length > 0) {
    dupPromises.push(
      (async () => {
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

  await Promise.all(dupPromises);

  // ─── Phase 4: Filter DB duplicates ─────────────────────────────────────────

  const toInsert: typeof dedupedInFile = [];

  for (const item of dedupedInFile) {
    const phone = item.normalizedPhone;
    const email = item.normalizedEmail;

    const phoneDup = phone && existingPhoneDigits.has(phone);
    const emailDup = email && existingEmails.has(email);

    if (phoneDup && emailDup) {
      duplicateCount++;
      errors.push({ row: item.rowNum, name: item.insert.full_name, error: "Duplicate phone & email already exist in database", field: "duplicate" });
      continue;
    }
    if (phoneDup) {
      duplicateCount++;
      errors.push({ row: item.rowNum, name: item.insert.full_name, error: "Duplicate phone already exists in database", field: "duplicate" });
      continue;
    }
    if (emailDup) {
      duplicateCount++;
      errors.push({ row: item.rowNum, name: item.insert.full_name, error: "Duplicate email already exists in database", field: "duplicate" });
      continue;
    }

    toInsert.push(item);
  }

  // ─── Phase 5: Bulk INSERT in batches ───────────────────────────────────────

  let successCount = 0;

  for (let i = 0; i < toInsert.length; i += DB_BATCH_SIZE) {
    const batch = toInsert.slice(i, i + DB_BATCH_SIZE);
    const rows = batch.map((b) => b.insert);

    const { data, error } = await (supabase as any)
      .from("leads")
      .insert(rows)
      .select("id");

    if (error) {
      // Batch failed — fall back to individual inserts
      for (const item of batch) {
        const { error: singleErr } = await (supabase as any)
          .from("leads")
          .insert(item.insert)
          .select("id");

        if (singleErr) {
          const msg = singleErr.message ?? "Failed to create";
          const isDup = msg.toLowerCase().includes("duplicate") ||
            msg.toLowerCase().includes("unique") ||
            msg.toLowerCase().includes("already exists") ||
            msg.toLowerCase().includes("violates unique");

          if (isDup) {
            duplicateCount++;
            errors.push({ row: item.rowNum, name: item.insert.full_name, error: "Duplicate detected by database constraint", field: "duplicate" });
          } else {
            failCount++;
            errors.push({ row: item.rowNum, name: item.insert.full_name, error: msg, field: "database" });
          }
        } else {
          successCount++;
        }
      }
    } else {
      successCount += data?.length ?? batch.length;
    }
  }

  // ─── Phase 6: Activity log ─────────────────────────────────────────────────

  if (errors.length > 0) {
    console.warn(`[bulk-upload] ${errors.length} issues out of ${leads.length} rows:`,
      errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.error}`).join("; "),
    );
  }

  if (successCount > 0) {
    logActivity({
      userId: auth.user.id,
      userName: auth.user.fullName ?? "Admin",
      role: auth.user.role as "admin" | "agent",
      actionType: "bulk_lead_upload",
      actionDescription: `Bulk uploaded ${successCount} leads (${duplicateCount} duplicates, ${failCount} failed) via "${assignmentMode}" mode`,
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
