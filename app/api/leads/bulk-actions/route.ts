import { NextResponse } from "next/server";
import { requireLeadsAdminApi } from "@/lib/api/require-leads-admin";
import { leadsService } from "@/services/leads.service";
import type { LeadStatus } from "@/types/lead";

const MAX_BULK_SIZE = 2000;
const BATCH_SIZE = 500; // Process in batches for DB efficiency

interface BulkActionPayload {
  action: "assign" | "status" | "delete";
  leadIds: string[];
  agentId?: string;
  status?: LeadStatus;
}

export async function POST(request: Request) {
  const auth = await requireLeadsAdminApi();
  if (auth.error) return auth.error;

  let body: BulkActionPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, leadIds, agentId, status } = body;

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: "No leads selected" }, { status: 400 });
  }

  if (leadIds.length > MAX_BULK_SIZE) {
    return NextResponse.json({ error: `Maximum ${MAX_BULK_SIZE} leads per bulk action` }, { status: 400 });
  }

  try {
    if (action === "delete") {
      // Batch soft-delete using .in() for maximum efficiency
      const deleted = await bulkSoftDelete(leadIds);
      return NextResponse.json({ success: deleted, failed: leadIds.length - deleted, total: leadIds.length });
    }

    if (action === "assign") {
      const updated = await bulkAssign(leadIds, agentId ?? null);
      return NextResponse.json({ success: updated, failed: leadIds.length - updated, total: leadIds.length });
    }

    if (action === "status" && status) {
      const updated = await bulkStatus(leadIds, status);
      return NextResponse.json({ success: updated, failed: leadIds.length - updated, total: leadIds.length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Batch soft-delete leads using .in() operator */
async function bulkSoftDelete(leadIds: string[]): Promise<number> {
  const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();

  let totalDeleted = 0;
  const now = new Date().toISOString();

  // Delete associated fund records first
  for (let i = 0; i < leadIds.length; i += BATCH_SIZE) {
    const batch = leadIds.slice(i, i + BATCH_SIZE);
    await (supabase as any).from("lead_funds").delete().in("lead_id", batch);
  }

  // Soft-delete leads in batches
  for (let i = 0; i < leadIds.length; i += BATCH_SIZE) {
    const batch = leadIds.slice(i, i + BATCH_SIZE);
    const { error, count } = await (supabase as any)
      .from("leads")
      .update({ deleted_at: now })
      .in("id", batch)
      .is("deleted_at", null)
      .select("id", { count: "exact", head: true });

    if (!error) {
      totalDeleted += count ?? batch.length;
    }
  }

  return totalDeleted;
}

/** Batch assign leads to an agent */
async function bulkAssign(leadIds: string[], agentId: string | null): Promise<number> {
  const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();

  let totalUpdated = 0;

  for (let i = 0; i < leadIds.length; i += BATCH_SIZE) {
    const batch = leadIds.slice(i, i + BATCH_SIZE);
    const { error, count } = await (supabase as any)
      .from("leads")
      .update({ assigned_agent_id: agentId })
      .in("id", batch)
      .is("deleted_at", null)
      .select("id", { count: "exact", head: true });

    if (!error) {
      totalUpdated += count ?? batch.length;
    }
  }

  return totalUpdated;
}

/** Batch update lead status */
async function bulkStatus(leadIds: string[], status: string): Promise<number> {
  const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();

  let totalUpdated = 0;
  const patch: Record<string, unknown> = { status };
  if (status === "converted") {
    patch.converted_at = new Date().toISOString();
  }

  for (let i = 0; i < leadIds.length; i += BATCH_SIZE) {
    const batch = leadIds.slice(i, i + BATCH_SIZE);
    const { error, count } = await (supabase as any)
      .from("leads")
      .update(patch)
      .in("id", batch)
      .is("deleted_at", null)
      .select("id", { count: "exact", head: true });

    if (!error) {
      totalUpdated += count ?? batch.length;
    }
  }

  return totalUpdated;
}
