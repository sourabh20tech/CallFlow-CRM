import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseAnonKey, getSupabaseUrl, normalizeSupabaseUrl } from "@/lib/supabase/env";

import type { SupabaseSchemaAudit } from "@/lib/supabase/schema-audit";
import { auditSupabaseSchema } from "@/lib/supabase/schema-audit";

export interface SupabaseHealthResult {
  ok: boolean;
  configured: boolean;
  url?: string;
  message: string;
  latencyMs?: number;
  authReachable?: boolean;
  databaseReachable?: boolean;
  schema?: SupabaseSchemaAudit;
}

/**
 * Verifies Supabase project URL and API key (REST + Auth).
 * Safe to call from server routes — does not expose secrets.
 */
export async function checkSupabaseConnection(): Promise<SupabaseHealthResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      configured: false,
      message: "Supabase environment variables are not set.",
    };
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const started = Date.now();

  let authReachable = false;
  let databaseReachable = false;
  let message = "Connected to Supabase.";

  try {
    const authRes = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anonKey },
      signal: AbortSignal.timeout(10_000),
    });
    authReachable = authRes.ok || authRes.status === 401;
  } catch {
    message = "Auth endpoint unreachable. Check NEXT_PUBLIC_SUPABASE_URL.";
  }

  try {
    const supabase = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });

    if (!error) {
      databaseReachable = true;
    } else if (error.code === "PGRST116" || error.message.includes("does not exist")) {
      databaseReachable = true;
      message =
        "API connected. Run database/migrations/ — profiles table not found yet.";
    } else if (error.code === "42501" || error.message.toLowerCase().includes("permission")) {
      databaseReachable = true;
      message = "API connected (RLS active). Migrations appear applied.";
    } else {
      message = `Database check: ${error.message}`;
      databaseReachable = false;
    }
  } catch (err) {
    message =
      err instanceof Error ? err.message : "Database connection failed.";
  }

  const schema = await auditSupabaseSchema().catch((): SupabaseSchemaAudit | undefined => undefined);

  const schemaOk = schema?.ready ?? false;
  const ok = authReachable && databaseReachable && schemaOk;
  const latencyMs = Date.now() - started;

  if (schema && !schema.ready && schema.blockers.length > 0) {
    message = schema.blockers[0] ?? message;
  } else if (schema?.ready) {
    message = "Connected. Schema, RLS helpers, and service role are configured.";
  }

  return {
    ok,
    configured: true,
    url: normalizeSupabaseUrl(url),
    message,
    latencyMs,
    authReachable,
    databaseReachable,
    schema,
  };
}
