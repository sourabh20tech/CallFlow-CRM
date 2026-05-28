export type UserRole = "admin" | "agent";

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: UserRole;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}
