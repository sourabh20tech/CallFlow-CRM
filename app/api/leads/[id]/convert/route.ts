import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { logActivity } from "@/lib/activity/log-activity";
import { agentPanelService } from "@/services/agent-panel.service";
import { leadsService } from "@/services/leads.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/leads/[id]/convert — Convert a lead with fund details.
 * Body: { fundAmount, paymentType, notes }
 */
export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fundAmount, paymentType, notes } = body as {
    fundAmount?: number;
    paymentType?: string;
    notes?: string;
  };

  if (!fundAmount || fundAmount <= 0) {
    return NextResponse.json({ error: "Fund amount is required and must be positive" }, { status: 400 });
  }

  try {
    // Agent ownership check
    if (auth.user.role === "agent") {
      const agentId = await resolveAgentId(auth.user.id);
      if (!agentId) return NextResponse.json({ error: "Agent not found" }, { status: 403 });
      await agentPanelService.assertLeadOwnedByAgent(id, agentId);
    }

    // Get lead before conversion
    const existingLead = await leadsService.getById(id);
    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Update lead status to converted
    const lead = await leadsService.update(id, {
      status: "converted",
      convertedAt: new Date().toISOString(),
    });

    // Store fund record — use admin client to bypass RLS
    const { createAdminSupabaseClient, isAdminClientConfigured } = await import("@/lib/supabase/admin");
    const { createClient } = await import("@/lib/supabase/server");
    const dbClient = isAdminClientConfigured() ? createAdminSupabaseClient() : await createClient();

    await (dbClient as any)
      .from("lead_funds")
      .insert({
        lead_id: id,
        agent_id: auth.user.id,
        amount: fundAmount,
        payment_type: paymentType ?? "other",
        notes: notes?.trim() || null,
        created_at: new Date().toISOString(),
      });

    // Log activity
    logActivity({
      userId: auth.user.id,
      userName: auth.user.fullName ?? "User",
      role: auth.user.role as "admin" | "agent",
      actionType: "lead_status_changed",
      actionDescription: `Converted lead "${lead.fullName}" — Fund: ₹${fundAmount.toLocaleString()} (${paymentType ?? "other"})`,
      entityType: "lead",
      entityId: id,
      metadata: { fundAmount, paymentType, oldStatus: existingLead.status, newStatus: "converted" },
    });

    return NextResponse.json(lead);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to convert lead";
    const status = message.includes("access") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

async function resolveAgentId(profileId: string): Promise<string | undefined> {
  const { agentsDbServiceServer } = await import("@/services/db/agents.service");
  const agents = await agentsDbServiceServer.list(true);
  return agents.find((a) => a.profileId === profileId)?.id;
}
