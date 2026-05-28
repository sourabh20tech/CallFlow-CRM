"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { AuthUserLike } from "@/lib/auth/auth-user";
import { formatAuthError } from "@/lib/auth/errors";
import { resolveSessionUser } from "@/lib/auth/resolve-session-user";
import { mapSupabaseAuthSession } from "@/lib/auth/session";
import { authService } from "@/services/auth.service";
import type { Session as SupabaseAuthSession } from "@supabase/supabase-js";
import type { LoginCredentials, Session, User, UserRole } from "@/types/auth";

const AUTH_INIT_TIMEOUT_MS = 3_000;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSigningOut: boolean;
  isAuthenticated: boolean;
  isDemo: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isAgent: boolean;
  signIn: (credentials: LoginCredentials) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signInInFlightRef = useRef(false);
  const mountedRef = useRef(true);

  const loadSessionUser = useCallback(
    async (
      supabase: ReturnType<typeof createClient>,
      authUser: AuthUserLike,
      supabaseSession?: SupabaseAuthSession | null,
    ): Promise<boolean> => {
      const resolved = await resolveSessionUser(supabase, authUser, {
        allowProvision: true,
      });

      if (!resolved) {
        setUser(null);
        setSession(null);
        return false;
      }

      setUser(resolved);
      setSession(mapSupabaseAuthSession(supabaseSession ?? null));
      return true;
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured()) throw new Error("Supabase is required for authentication.");

    const supabase = createClient();

    try {
      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession();

      if (!supabaseSession?.user) {
        setUser(null);
        setSession(null);
        return;
      }

      await loadSessionUser(supabase, supabaseSession.user, supabaseSession);
    } catch (error) {
      console.error("[auth] refreshUser error:", error);
      setUser(null);
      setSession(null);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [loadSessionUser]);

  useEffect(() => {
    mountedRef.current = true;

    if (!isSupabaseConfigured()) {
      setUser(null);
      setSession(null);
      setIsLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    const supabase = createClient();
    const initTimeout = window.setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }, AUTH_INIT_TIMEOUT_MS);

    void (async () => {
      try {
        const {
          data: { session: supabaseSession },
        } = await supabase.auth.getSession();

        if (!supabaseSession?.user) {
          setUser(null);
          setSession(null);
          return;
        }

        await loadSessionUser(supabase, supabaseSession.user, supabaseSession);
      } catch (error) {
        console.error("[auth] bootstrap error:", error);
        setUser(null);
        setSession(null);
      } finally {
        window.clearTimeout(initTimeout);
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, supabaseSession) => {
      if (!mountedRef.current) return;

      if (event === "INITIAL_SESSION") {
        return;
      }

      if (event === "SIGNED_OUT" || !supabaseSession?.user) {
        setUser(null);
        setSession(null);
        setIsLoading(false);
        return;
      }

      if (event === "SIGNED_IN" && signInInFlightRef.current) {
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void loadSessionUser(supabase, supabaseSession.user, supabaseSession);
      }
    });

    return () => {
      mountedRef.current = false;
      window.clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, [loadSessionUser]);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    if (!isSupabaseConfigured()) {
      return { error: "Supabase is required for sign-in." };
    }

    signInInFlightRef.current = true;
    try {
      const { user: signedInUser, error, session: newSession } =
        await authService.signIn(credentials);

      if (error) {
        console.error("[auth] signIn returned error:", error.message);
        return { error: formatAuthError(error) };
      }

      if (signedInUser) {
        setUser(signedInUser);
        setSession(mapSupabaseAuthSession(newSession));
      }

      return {};
    } catch (err) {
      console.error("[auth] signIn context error:", err);
      return { error: formatAuthError(err) };
    } finally {
      signInInFlightRef.current = false;
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      if (!isSupabaseConfigured()) {
        setUser(null);
        setSession(null);
        return;
      }

      await authService.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setIsSigningOut(false);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      isSigningOut,
      isAuthenticated: Boolean(user),
      isDemo: false,
      role: user?.role ?? null,
      isAdmin: user?.role === "admin",
      isAgent: user?.role === "agent",
      signIn,
      signOut,
      refreshUser,
    }),
    [user, session, isLoading, isSigningOut, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
