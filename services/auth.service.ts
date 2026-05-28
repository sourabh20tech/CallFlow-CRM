import { assertAgentCanAuthenticate } from "@/lib/auth/agent-account";
import { ensureProfileViaRpc } from "@/lib/auth/ensure-profile-rpc";
import { formatAuthError, rolePortalMismatchMessage } from "@/lib/auth/errors";
import { profileToUser, resolveUserFromAuth } from "@/lib/auth/profile";
import { withTimeout } from "@/lib/auth/with-timeout";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl, isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  ForgotPasswordInput,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "@/types/auth";

const SIGN_IN_TIMEOUT_MS = 20_000;
const SYNC_PROFILE_TIMEOUT_MS = 8_000;
const RESOLVE_USER_TIMEOUT_MS = 10_000;

export class AuthService {
  private get supabase() {
    return createClient();
  }

  private normalizeCredentials(credentials: LoginCredentials): LoginCredentials {
    return {
      ...credentials,
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    };
  }

  private async syncProfileAfterSignIn(portalRole: LoginCredentials["role"]): Promise<User | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SYNC_PROFILE_TIMEOUT_MS);

    try {
      const res = await fetch("/api/auth/sync-profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({ role: portalRole }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: User;
      };

      if (!res.ok) {
        console.warn("[auth] sync-profile failed:", body.error ?? res.status);
        return null;
      }

      return body.user ?? null;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("[auth] sync-profile timed out");
      } else {
        console.error("[auth] sync-profile error:", error);
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async resolveUserAfterAuth(
    authUser: NonNullable<
      Awaited<ReturnType<typeof this.supabase.auth.signInWithPassword>>["data"]["user"]
    >,
    portalRole: LoginCredentials["role"],
  ): Promise<User | null> {
    let user = await withTimeout(
      resolveUserFromAuth(this.supabase, authUser),
      RESOLVE_USER_TIMEOUT_MS,
      "Profile lookup timed out",
    ).catch((error) => {
      console.error("[auth] resolveUserFromAuth error:", error);
      return null;
    });

    if (user) {
      return user;
    }

    const rpcProfile = await ensureProfileViaRpc(this.supabase, portalRole);
    if (rpcProfile) {
      user = profileToUser(rpcProfile);
      return user;
    }

    user = await this.syncProfileAfterSignIn(portalRole);
    if (user) {
      return user;
    }

    return withTimeout(
      resolveUserFromAuth(this.supabase, authUser),
      RESOLVE_USER_TIMEOUT_MS,
      "Profile lookup timed out",
    ).catch(() => null);
  }

  async signIn(credentials: LoginCredentials) {
    const { email, password, role } = this.normalizeCredentials(credentials);

    try {
      const { data, error } = await withTimeout(
        this.supabase.auth.signInWithPassword({ email, password }),
        SIGN_IN_TIMEOUT_MS,
        "Sign in timed out. Check your connection and try again.",
      );

      if (error) {
        console.error("[auth] signInWithPassword error:", error.message);
        return { user: null, error: { message: formatAuthError(error) } };
      }

      if (!data.user || !data.session) {
        console.error("[auth] signInWithPassword: missing user or session");
        return { user: null, error: { message: "Sign in failed. No session returned." } };
      }

      const user = await this.resolveUserAfterAuth(data.user, role);

      if (!user) {
        console.error("[auth] signIn: no CRM profile for user", data.user.id);
        await this.supabase.auth.signOut();
        return {
          user: null,
          error: {
            message:
              "Account profile not found. Confirm your row exists in public.profiles with the correct role, or run migration 005_profiles_ensure_rpc.sql.",
          },
        };
      }

      if (user.role !== role) {
        console.warn("[auth] signIn: portal mismatch", {
          expected: role,
          actual: user.role,
          userId: user.id,
        });
        await this.supabase.auth.signOut();
        return {
          user: null,
          error: {
            message: rolePortalMismatchMessage(user.role, role),
          },
        };
      }

      const agentAccess = await assertAgentCanAuthenticate(this.supabase, user.id, user.role);
      if (!agentAccess.ok) {
        console.warn("[auth] signIn: inactive agent", user.id);
        await this.supabase.auth.signOut();
        return { user: null, error: { message: agentAccess.message } };
      }

      return { user, error: null, session: data.session };
    } catch (error) {
      console.error("[auth] signIn unexpected error:", error);
      try {
        await this.supabase.auth.signOut();
      } catch (signOutError) {
        console.error("[auth] signOut after failure:", signOutError);
      }

      const message =
        error instanceof Error ? formatAuthError(error) : "Sign in failed. Please try again.";

      return { user: null, error: { message } };
    }
  }

  async signUp({ email, password, fullName, role = "agent" }: RegisterCredentials) {
    if (isSupabaseConfigured()) {
      throw new Error(
        "Self-registration is disabled. Ask an administrator to create your agent account.",
      );
    }

    return this.supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${getAppUrl()}/login`,
      },
    });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  async getSession() {
    return this.supabase.auth.getSession();
  }

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user: authUser },
    } = await this.supabase.auth.getUser();

    if (!authUser) return null;
    return resolveUserFromAuth(this.supabase, authUser);
  }

  async resetPassword({ email }: ForgotPasswordInput) {
    const redirectTo = `${getAppUrl()}/reset-password`;
    return this.supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });
  }

  async updatePassword(password: string) {
    return this.supabase.auth.updateUser({ password });
  }

  isConfigured() {
    return isSupabaseConfigured();
  }
}

export const authService = new AuthService();
