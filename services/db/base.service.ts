import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";
import { createBrowserSupabaseClient } from "@/lib/supabase/typed-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type DbClientContext = "browser" | "server";

/**
 * Resolves a typed Supabase client for the current runtime.
 * Services accept an injected client for testing and server actions.
 */
export async function resolveDbClient(
  context: DbClientContext,
  client?: TypedSupabaseClient,
): Promise<TypedSupabaseClient> {
  if (client) return client;
  if (!isSupabaseConfigured()) {
    throw new Error("Database unavailable — configure Supabase in .env.local");
  }
  if (context === "server") {
    return (await createServerSupabaseClient()) as unknown as TypedSupabaseClient;
  }
  return createBrowserSupabaseClient();
}

export abstract class BaseDbService {
  protected readonly context: DbClientContext;

  constructor(context: DbClientContext = "browser") {
    this.context = context;
  }

  protected async db(client?: TypedSupabaseClient): Promise<TypedSupabaseClient> {
    return resolveDbClient(this.context, client);
  }
}
