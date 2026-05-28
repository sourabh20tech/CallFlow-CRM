import type { User, UserRole } from "@/types/auth";

const DEMO_STORAGE_KEY = "callcenter_crm_demo_user";

export const DEMO_USERS: Record<UserRole, User> = {
  admin: {
    id: "demo-admin",
    email: "admin@callcenter.demo",
    fullName: "Demo Administrator",
    role: "admin",
  },
  agent: {
    id: "demo-agent",
    email: "agent@callcenter.demo",
    fullName: "Demo Agent",
    role: "agent",
  },
};

export function getDemoUser(role: UserRole): User {
  return DEMO_USERS[role];
}

export function loadDemoUserFromStorage(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (parsed.role === "admin" || parsed.role === "agent") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveDemoUserToStorage(user: User): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user));
}

export function clearDemoUserFromStorage(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DEMO_STORAGE_KEY);
}
