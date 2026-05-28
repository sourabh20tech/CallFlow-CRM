import type { Session as SupabaseAuthSession } from "@supabase/supabase-js";
import type { Session } from "@/types/auth";

export function mapSupabaseAuthSession(
  supabaseSession: SupabaseAuthSession | null | undefined,
): Session | null {
  if (!supabaseSession?.access_token) return null;

  return {
    accessToken: supabaseSession.access_token,
    refreshToken: supabaseSession.refresh_token ?? undefined,
    expiresAt: supabaseSession.expires_at ?? undefined,
  };
}
