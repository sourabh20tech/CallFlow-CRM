import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminSupabaseClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { SYSTEM_SETTINGS_KEY } from "@/lib/system/constants";
import { FOLLOWUPS_TABLE_NAME } from "@/lib/followups/constants";

const REQUIRED_TABLES = [
  "profiles",
  "agents",
  "leads",
  "lead_notes",
  "call_logs",
  FOLLOWUPS_TABLE_NAME,
  "reports",
  "dashboard_stats",
  "activity_logs",
  "system_settings",
] as const;

const REQUIRED_VIEWS = [] as const;

const REQUIRED_RPCS = ["is_admin", "is_agent", "ensure_current_user_profile"] as const;

export interface SchemaItemStatus {
  name: string;
  ok: boolean;
  code?: string;
  message?: string;
}

const AGENT_CREATE_TABLES = ["profiles", "agents"] as const;

export function isAgentCreateReady(audit: SupabaseSchemaAudit): boolean {
  if (!audit.env.serviceRoleKey) {
    return false;
  }

  return AGENT_CREATE_TABLES.every(
    (name) => audit.tables.find((table) => table.name === name)?.ok === true,
  );
}

export interface SupabaseSchemaAudit {
  env: {
    url: boolean;
    anonKey: boolean;
    serviceRoleKey: boolean;
  };
  tables: SchemaItemStatus[];
  views: SchemaItemStatus[];
  rpcs: SchemaItemStatus[];
  missingTables: string[];
  missingViews: string[];
  missingRpcs: string[];
  systemSettingsSeeded: boolean;
  ready: boolean;
  blockers: string[];
}

async function probeTable(
  client: ReturnType<typeof createClient<Database>>,
  name: string,
): Promise<SchemaItemStatus> {
  const { error } = await client.from(name).select("id", { head: true, count: "exact" });

  if (!error) {
    return { name, ok: true };
  }

  if (error.code === "PGRST205" || error.message.includes("Could not find the table")) {
    return { name, ok: false, code: error.code, message: "Table not in schema cache" };
  }

  return { name, ok: true, code: error.code, message: error.message };
}

async function probeView(
  client: ReturnType<typeof createClient<Database>>,
  name: string,
): Promise<SchemaItemStatus> {
  const { error } = await client.from(name).select("id", { head: true, count: "exact" });

  if (!error) {
    return { name, ok: true };
  }

  if (error.code === "PGRST205" || error.message.includes("Could not find the table")) {
    return { name, ok: false, code: error.code, message: "View not in schema cache" };
  }

  return { name, ok: true, code: error.code, message: error.message };
}

async function probeRpc(
  client: ReturnType<typeof createClient<Database>>,
  name: string,
): Promise<SchemaItemStatus> {
  if (name === "ensure_current_user_profile") {
    const { error } = await client.rpc(name, { requested_role: null });
    if (!error) {
      return { name, ok: true };
    }
    if (error.code === "PGRST202") {
      return { name, ok: false, code: error.code, message: "Function missing" };
    }
    if (error.message.includes("Not authenticated") || error.code === "P0001") {
      return { name, ok: true, message: "Present (requires auth session to execute)" };
    }
    return { name, ok: false, code: error.code, message: error.message };
  }

  const { error } = await client.rpc(
    name as "is_admin" | "is_agent" | "ensure_current_user_profile",
  );
  if (!error) {
    return { name, ok: true };
  }
  if (error.code === "PGRST202") {
    return { name, ok: false, code: error.code, message: "Function missing" };
  }
  return { name, ok: true, code: error.code, message: error.message };
}

async function ensureSystemSettingsRow(
  admin: ReturnType<typeof createAdminSupabaseClient>,
): Promise<boolean> {
  let data: { id: string } | null = null;
  try {
    const res = await admin
      .from("system_settings")
      .select("id")
      .eq("setting_key", SYSTEM_SETTINGS_KEY)
      .limit(1)
      .maybeSingle();
    data = res.data;
  } catch {
    const res = await admin
      .from("system_settings")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    data = res.data;
  }

  if (data) {
    return false;
  }

  let error = null as { message: string } | null;
  try {
    const res = await admin.from("system_settings").insert({
      setting_key: SYSTEM_SETTINGS_KEY,
      crm_enabled: true,
      maintenance_mode: false,
    });
    error = res.error as { message: string } | null;
  } catch {
    const res = await admin.from("system_settings").insert({
      crm_enabled: true,
    });
    error = res.error as { message: string } | null;
  }

  return !error;
}

export async function auditSupabaseSchema(): Promise<SupabaseSchemaAudit> {
  const env = {
    url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    anonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    serviceRoleKey: isAdminClientConfigured(),
  };

  const blockers: string[] = [];

  if (!isSupabaseConfigured()) {
    return {
      env,
      tables: [],
      views: [],
      rpcs: [],
      missingTables: [...REQUIRED_TABLES],
      missingViews: [...REQUIRED_VIEWS],
      missingRpcs: [...REQUIRED_RPCS],
      systemSettingsSeeded: false,
      ready: false,
      blockers: ["NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required."],
    };
  }

  if (!env.serviceRoleKey) {
    blockers.push("SUPABASE_SERVICE_ROLE_KEY is missing (Add Agent / admin APIs need it).");
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const admin = env.serviceRoleKey ? createAdminSupabaseClient() : client;

  const tables = await Promise.all(REQUIRED_TABLES.map((t) => probeTable(admin, t)));
  const views = await Promise.all(REQUIRED_VIEWS.map((v) => probeView(admin, v)));
  const rpcs = await Promise.all(REQUIRED_RPCS.map((r) => probeRpc(admin, r)));

  const missingTables = tables.filter((t) => !t.ok).map((t) => t.name);
  const missingViews = views.filter((v) => !v.ok).map((v) => v.name);
  const missingRpcs = rpcs.filter((r) => !r.ok).map((r) => r.name);

  if (missingTables.length > 0) {
    blockers.push(`Missing tables: ${missingTables.join(", ")}. Run CRM schema SQL in Supabase.`);
  }

  if (missingViews.length > 0) {
    blockers.push(`Missing views: ${missingViews.join(", ")}. Run CRM schema SQL in Supabase.`);
  }

  if (missingRpcs.length > 0) {
    blockers.push(
      `Missing functions: ${missingRpcs.join(", ")}. RLS policies require is_admin/is_agent — run full CRM schema SQL.`,
    );
  }

  let systemSettingsSeeded = false;
  if (env.serviceRoleKey) {
    try {
      systemSettingsSeeded = await ensureSystemSettingsRow(createAdminSupabaseClient());
    } catch {
      /* non-fatal */
    }
  }

  const ready =
    blockers.length === 0 &&
    missingTables.length === 0 &&
    missingViews.length === 0 &&
    missingRpcs.length === 0;

  return {
    env,
    tables,
    views,
    rpcs,
    missingTables,
    missingViews,
    missingRpcs,
    systemSettingsSeeded,
    ready,
    blockers,
  };
}
