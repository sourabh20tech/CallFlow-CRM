import type { UserRole } from "@/types/auth";

export interface AuthUserLike {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export interface ProvisionProfileOptions {
  /** Login portal role — used only when creating a new profile row */
  preferredRole?: UserRole;
}
