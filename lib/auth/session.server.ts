import "server-only";

import { assertAgentCanAuthenticate } from "@/lib/auth/agent-account";
import { resolveSessionUser } from "@/lib/auth/resolve-session-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types/auth";

/** 
 * Resolves the authenticated CRM user on the server.
 */
export async function getServerUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    return null;
  }

  const resolved = await resolveSessionUser(supabase, authUser, {
    allowProvision: true,
  });

  if (!resolved) {
    return null;
  }

  // Skip agent check for admins (saves 1 DB query)
  if (resolved.role === "agent") {
    const access = await assertAgentCanAuthenticate(supabase, resolved.id, resolved.role);
    if (!access.ok) {
      return null;
    }
  }

  return resolved;
}

export async function requireServerUser(): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
