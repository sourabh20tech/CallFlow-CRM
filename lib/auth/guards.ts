import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { User, UserRole } from "@/types/auth";

export async function requireAuth(): Promise<User> {
  if (!isSupabaseConfigured()) {
    throw new Error("requireAuth called without Supabase — use client AuthGuard in demo mode");
  }

  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(role: UserRole | UserRole[]): Promise<User> {
  const user = await requireAuth();
  const roles = Array.isArray(role) ? role : [role];

  if (!roles.includes(user.role)) {
    redirect("/dashboard?error=forbidden");
  }

  return user;
}

export async function requireAdmin(): Promise<User | void> {
  if (!isSupabaseConfigured()) {
    return;
  }
  return requireRole("admin");
}
