import type { RealtimeChannel } from "@supabase/supabase-js";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";

export type RealtimeTable =
  | "leads"
  | "agents"
  | "call_logs"
  | "follow_ups"
  | "lead_notes"
  | "system_settings";

export interface SubscribeTableOptions {
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  onPayload: () => void;
}

/**
 * Subscribe to Postgres changes — use in client components with cleanup.
 * @example
 * const channel = subscribeToTable(supabase, 'leads', { onPayload: () => refresh() });
 * return () => { supabase.removeChannel(channel); };
 */
export function subscribeToTable(
  supabase: TypedSupabaseClient,
  table: RealtimeTable,
  options: SubscribeTableOptions,
): RealtimeChannel {
  return supabase
    .channel(`public:${table}`)
    .on(
      "postgres_changes",
      {
        event: options.event ?? "*",
        schema: "public",
        table,
        filter: options.filter,
      },
      () => options.onPayload(),
    )
    .subscribe();
}
