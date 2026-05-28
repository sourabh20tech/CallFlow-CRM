import type { UserRole } from "@/types/auth";
import { roleLabel } from "@/lib/auth/roles";

/**
 * Maps Supabase Auth errors to user-safe messages.
 */
export function formatAuthError(error: unknown): string {
  if (!error) return "An unexpected error occurred.";

  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: string }).message)
          : "An unexpected error occurred.";

  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return "Invalid email or password.";
  }
  if (lower.includes("user is banned") || lower.includes("banned")) {
    return "This account has been deactivated. Contact your administrator.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch failed")) {
    return "Network error. Check your connection and try again.";
  }

  return message;
}

/** When the user picks the wrong Admin / Agent tab on the login form */
export function rolePortalMismatchMessage(actualRole: UserRole, selectedPortal: UserRole): string {
  return `This account is registered as ${roleLabel(actualRole)}. Sign in using the ${roleLabel(actualRole)} portal, not ${roleLabel(selectedPortal)}.`;
}
