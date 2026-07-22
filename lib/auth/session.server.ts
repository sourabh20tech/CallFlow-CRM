import "server-only";

import { cache } from "react";
import { assertAgentCanAuthenticate } from "@/lib/auth/agent-account";
import { resolveSessionUser } from "@/lib/auth/resolve-session-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types/auth";

/** 
 * Resolves the authenticated CRM user on the server.
 * Uses React cache() to deduplicate within the same request.
 * Uses getSession() (local cookie read) instead of getUser() (network call)
 * for faster API responses.
 */
export const getServerUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  
  // getSession() reads from cookie — NO network call to Supabase Auth
  // This saves ~1.4s per request compared to getUser()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return null;
  }

  const authUser = session.user;

  const resolved = await resolveSessionUser(supabase, authUser, {
    allowProvision: false, // Don't provision on API calls — only on login
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
});

export async function requireServerUser(): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
