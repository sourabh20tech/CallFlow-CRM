"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const INACTIVITY_MS = 4 * 60 * 1000; // 4 minutes → show warning
const LOGOUT_GRACE_MS = 60 * 1000; // 60 seconds after warning → auto logout
const STORAGE_KEY = "crm_last_activity";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;
const THROTTLE_MS = 5000; // Throttle activity writes to every 5s

/**
 * Agent-only inactivity auto-logout hook.
 * - After 4 min idle → shows warning
 * - After 5 min total idle → auto logout
 * - Multi-tab sync via localStorage
 * - Does nothing for admin role
 */
export function useInactivityLogout() {
  const { role, signOut, isAuthenticated } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWriteRef = useRef(0);
  const isAgent = role === "agent" && isAuthenticated;

  // Reset all timers
  const resetTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    setShowWarning(false);

    if (!isAgent) return;

    // Start warning timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);

      // Start logout countdown
      logoutTimerRef.current = setTimeout(() => {
        void performLogout();
      }, LOGOUT_GRACE_MS);
    }, INACTIVITY_MS);
  }, [isAgent]);

  // Perform logout
  const performLogout = useCallback(async () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    setShowWarning(false);

    try {
      await signOut();
    } catch {}

    // Notify other tabs
    localStorage.setItem("crm_force_logout", Date.now().toString());
    localStorage.removeItem("crm_force_logout");

    window.location.href = "/login";
  }, [signOut]);

  // Record activity (throttled)
  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastWriteRef.current < THROTTLE_MS) return;
    lastWriteRef.current = now;

    // Sync across tabs
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {}

    resetTimers();
  }, [resetTimers]);

  // "Stay Logged In" handler
  const stayLoggedIn = useCallback(() => {
    recordActivity();
    setShowWarning(false);
  }, [recordActivity]);

  // Setup listeners (agent only)
  useEffect(() => {
    if (!isAgent) return;

    // Initial timer start
    resetTimers();

    // Activity listeners
    const handleActivity = () => recordActivity();
    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, handleActivity, { passive: true });
    }

    // Multi-tab sync: listen for activity in other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        // Another tab had activity — reset our timers
        resetTimers();
      }
      if (e.key === "crm_force_logout") {
        // Another tab triggered logout
        window.location.href = "/login";
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, handleActivity);
      }
      window.removeEventListener("storage", handleStorage);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [isAgent, resetTimers, recordActivity]);

  return {
    showWarning,
    stayLoggedIn,
    logoutNow: performLogout,
  };
}
