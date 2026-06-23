import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { agentPanelService } from "@/services/agent-panel.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/leads/[id]/funds — Get fund history for a lead */
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    // Agent ownership check
    if (auth.user.role === "agent") {
      const { agentsDbServiceServer } = await import("@/services/db/agents.service");
      const agents = await agentsDbServiceServer.list(true);
      const agentId = agents.find((a) => a.profileId === auth.user.id)?.id;
      if (agentId) {
        await agentPanelService.assertLeadOwnedByAgent(id, agentId);
      }
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("lead_funds")
      .select("id, lead_id, agent_id, amount, payment_type, notes, created_at")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const funds = (data ?? []) as any[];
    const totalFund = funds.reduce((sum: number, f: any) => sum + Number(f.amount), 0);

    return NextResponse.json({ funds, totalFund });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load funds";
    const status = message.includes("access") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** POST /api/leads/[id]/funds — Add additional fund to a converted lead */
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

  const { amount, notes } = body as { amount?: number; notes?: string };

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  }

  try {
    // Agent ownership check
    if (auth.user.role === "agent") {
      const { agentsDbServiceServer } = await import("@/services/db/agents.service");
      const agents = await agentsDbServiceServer.list(true);
      const agentId = agents.find((a) => a.profileId === auth.user.id)?.id;
      if (agentId) {
        await agentPanelService.assertLeadOwnedByAgent(id, agentId);
      }
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("lead_funds")
      .insert({
        lead_id: id,
        agent_id: auth.user.id,
        amount,
        payment_type: "other",
        notes: notes?.trim() || null,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add fund";
    const status = message.includes("access") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
