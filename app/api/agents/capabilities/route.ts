import { NextResponse } from "next/server";
import { requireAgentsAdminApi } from "@/lib/api/require-agents-admin";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { auditSupabaseSchema, isAgentCreateReady } from "@/lib/supabase/schema-audit";

export async function GET() {
  const auth = await requireAgentsAdminApi();
  if (auth.error) return auth.error;

  const supabaseOn = isSupabaseConfigured();
  const serviceRoleOk = isAdminClientConfigured();
  const schema = supabaseOn ? await auditSupabaseSchema().catch(() => null) : null;

  const agentCreateReady = schema ? isAgentCreateReady(schema) : false;
  const canCreate = !supabaseOn || (serviceRoleOk && agentCreateReady);

  let message: string | null = null;
  if (!supabaseOn) {
    message = null;
  } else if (!serviceRoleOk) {
    message = "Add SUPABASE_SERVICE_ROLE_KEY to .env.local to create agents with Supabase Auth.";
  } else if (schema && !agentCreateReady) {
    const missingAgentTables = ["profiles", "agents"].filter(
      (name) => !schema.tables.find((table) => table.name === name)?.ok,
    );
    message =
      missingAgentTables.length > 0
        ? `Missing tables: ${missingAgentTables.join(", ")}. Run CRM schema SQL in Supabase.`
        : (schema.blockers[0] ?? "Database schema incomplete. Run CRM SQL in Supabase.");
  }

  return NextResponse.json({
    canCreate,
    demoMode: !supabaseOn,
    message,
    schemaReady: schema?.ready ?? null,
    missingRpcs: schema?.missingRpcs ?? [],
  });
}
