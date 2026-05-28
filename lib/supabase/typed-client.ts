import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export type TypedSupabaseClient = SupabaseClient<Database>;

export function createBrowserSupabaseClient(): TypedSupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add credentials to .env.local");
  }

  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
