import { fetchProfile } from "@/lib/auth/profile";
import { createAdminSupabaseClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Ensures an agents row exists for agent-role profiles (Add Agent / signup trigger gaps).
 * Uses service role when available so RLS does not block insert.
 */
export async function ensureAgentRowForProfile(profileId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("agents")
    .select("id")
    .eq("profile_id", profileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!readError && existing?.id) {
    return existing.id;
  }

  const profile = await fetchProfile(supabase, profileId);
  if (!profile || profile.role !== "agent") {
    return null;
  }

  if (!isAdminClientConfigured()) {
    return null;
  }

  const admin = createAdminSupabaseClient();

  const { data: inserted, error: insertError } = await admin
    .from("agents")
    .insert({ profile_id: profileId })
    .select("id")
    .single();

  if (!insertError && inserted?.id) {
    return inserted.id;
  }

  const { data: retry } = await admin
    .from("agents")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  return retry?.id ?? null;
}
