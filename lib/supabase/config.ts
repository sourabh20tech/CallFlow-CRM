import { normalizeSupabaseUrl } from "@/lib/supabase/env";

export function isSupabaseConfigured(): boolean {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

export function requireSupabaseConfigured(context: string): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      `Supabase is required for ${context}. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.`,
    );
  }
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";
}
