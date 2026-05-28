import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Service-role client — bypasses RLS. Use ONLY in trusted server contexts
 * (cron jobs, webhooks, admin scripts). Never import in client components.
 */
export function createAdminSupabaseClient() {
  const serviceKey = getSupabaseServiceRoleKey();

  if (!serviceKey) {
    throw new Error(
      "Admin client requires SUPABASE_SERVICE_ROLE_KEY in .env.local (server-only).",
    );
  }

  return createClient<Database>(getSupabaseUrl(), serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isAdminClientConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(getSupabaseServiceRoleKey());
}
