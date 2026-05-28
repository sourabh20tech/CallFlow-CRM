import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export { isSupabaseConfigured };
export { createBrowserSupabaseClient } from "@/lib/supabase/typed-client";
export type { TypedSupabaseClient } from "@/lib/supabase/typed-client";

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let browserClient: BrowserClient | null = null;

/**
 * Singleton browser Supabase client — required for stable auth cookies and session persistence.
 */
export function createClient(): BrowserClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add credentials to .env.local");
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
  }

  return browserClient;
}

/** Clears cached client (tests only). */
export function resetBrowserClientForTests(): void {
  browserClient = null;
}
