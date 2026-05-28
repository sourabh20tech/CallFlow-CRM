/**
 * Supabase environment configuration.
 * Normalizes project URL (strips /rest/v1/ and trailing slashes).
 */

function trim(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v && v.length > 0 ? v : undefined;
}

/** Project URL only — never include /rest/v1/ */
export function normalizeSupabaseUrl(url: string | undefined): string | undefined {
  const trimmed = trim(url);
  if (!trimmed) return undefined;

  try {
    const parsed = new URL(trimmed);
    parsed.pathname = parsed.pathname.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "") || "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return trimmed.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
  }
}

export function getSupabaseUrl(): string {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local (project URL without /rest/v1/).",
    );
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = trim(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Add your publishable/anon key to .env.local.",
    );
  }
  return key;
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return trim(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseEnv() {
  return {
    url: getSupabaseUrl(),
    anonKey: getSupabaseAnonKey(),
    serviceRoleKey: getSupabaseServiceRoleKey(),
  };
}
