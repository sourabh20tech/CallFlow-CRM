/**
 * Supabase integration — import from `@/lib/supabase`.
 *
 * @example Browser (Client Components)
 * import { createBrowserSupabaseClient } from "@/lib/supabase";
 *
 * @example Server (Server Components, Route Handlers)
 * import { createServerSupabaseClient } from "@/lib/supabase";
 *
 * @example Admin (server-only, bypasses RLS)
 * import { createAdminSupabaseClient, isAdminClientConfigured } from "@/lib/supabase";
 */

export {
  isSupabaseConfigured,
  getAppUrl,
} from "@/lib/supabase/config";

export {
  normalizeSupabaseUrl,
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/lib/supabase/env";

export {
  createBrowserSupabaseClient,
  type TypedSupabaseClient,
} from "@/lib/supabase/typed-client";

export { createClient as createBrowserClient } from "@/lib/supabase/client";

export {
  createServerSupabaseClient,
  createClient as createServerClient,
  type TypedSupabaseServerClient,
} from "@/lib/supabase/server";

export {
  createAdminSupabaseClient,
  isAdminClientConfigured,
} from "@/lib/supabase/admin";

export { updateSession } from "@/lib/supabase/middleware";
export { checkSupabaseConnection, type SupabaseHealthResult } from "@/lib/supabase/health";
