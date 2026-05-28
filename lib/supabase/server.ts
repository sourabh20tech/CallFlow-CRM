import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export type TypedSupabaseServerClient = ReturnType<typeof createServerSupabaseClient>;

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add credentials to .env.local");
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component — middleware refreshes session
          }
        },
      },
    },
  );
}

/** Alias for existing imports */
export async function createClient() {
  return createServerSupabaseClient();
}
