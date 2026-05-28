import type { PostgrestError } from "@supabase/supabase-js";

/** Human-readable message when PostgREST returns an empty `message` string. */
export function formatPostgrestErrorMessage(error: PostgrestError): string {
  const parts = [error.message, error.details, error.hint]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" — ");
  }

  const code = error.code?.trim();
  if (code) {
    return `Database request failed (${code})`;
  }

  return "Database request failed";
}

export function isPostgrestError(value: unknown): value is PostgrestError {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as PostgrestError).message === "string"
  );
}

export function toDbError(error: unknown, fallback = "Database request failed"): DbError {
  if (error instanceof DbError) return error;
  if (isPostgrestError(error)) return DbError.fromPostgrest(error);
  if (error instanceof Error && error.message.trim()) {
    return new DbError(error.message);
  }
  return new DbError(fallback);
}

export class DbError extends Error {
  readonly code: string;
  readonly details?: string;
  readonly hint?: string;

  constructor(message: string, code = "DB_ERROR", details?: string, hint?: string) {
    super(message.trim() || "Database request failed");
    this.name = "DbError";
    this.code = code;
    this.details = details;
    this.hint = hint;
  }

  static fromPostgrest(error: PostgrestError): DbError {
    return new DbError(
      formatPostgrestErrorMessage(error),
      error.code ?? "DB_ERROR",
      error.details ?? undefined,
      error.hint ?? undefined,
    );
  }
}

export class NotFoundError extends DbError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} not found: ${id}` : `${resource} not found`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export function isNotFoundError(error: unknown): boolean {
  if (error instanceof NotFoundError) return true;
  if (error instanceof DbError && error.code === "NOT_FOUND") return true;
  if (typeof error === "object" && error !== null && "code" in error) {
    return (error as PostgrestError).code === "PGRST116";
  }
  return false;
}
