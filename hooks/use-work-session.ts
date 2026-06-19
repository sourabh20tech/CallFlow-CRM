"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HEARTBEAT_INTERVAL_MS = 60_000; // Send heartbeat every 60s

interface WorkSessionState {
  sessionId: string | null;
  loginTime: string | null;
  activeSeconds: number;
  isActive: boolean;
}

/**
 * Hook that manages work session lifecycle:
 * - Starts a session on mount (login)
 * - Tracks only ACTIVE time (tab visible + window focused)
 * - Sends heartbeat to server every 60s with accumulated active seconds
 * - Ends session on explicit logout or beforeunload
 */
export function useWorkSession() {
  const [state, setState] = useState<WorkSessionState>({
    sessionId: null,
    loginTime: null,
    activeSeconds: 0,
    isActive: false,
  });

  // Refs for tracking without re-renders
  const activeSecondsRef = useRef(0);
  const isVisibleRef = useRef(!document.hidden);
  const lastTickRef = useRef(Date.now());
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartedRef = useRef(false);

  // Start tracking active time
  const startTicking = useCallback(() => {
    if (tickIntervalRef.current) return;
    lastTickRef.current = Date.now();
    tickIntervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        const now = Date.now();
        const delta = Math.floor((now - lastTickRef.current) / 1000);
        if (delta > 0 && delta < 5) {
          // Only count reasonable deltas (< 5s to avoid sleep/suspend gaps)
          activeSecondsRef.current += delta;
        }
        lastTickRef.current = now;
      } else {
        // Not visible — just update the tick reference without adding time
        lastTickRef.current = Date.now();
      }
    }, 1000);
  }, []);

  const stopTicking = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  // Send heartbeat to server
  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch("/api/work-sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "heartbeat",
          activeSeconds: activeSecondsRef.current,
        }),
      });
    } catch {
      // Silently fail
    }
  }, []);

  // End session
  const endSession = useCallback(async () => {
    stopTicking();
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    try {
      await fetch("/api/work-sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          activeSeconds: activeSecondsRef.current,
        }),
      });
    } catch {
      // Silently fail
    }

    setState((prev) => ({ ...prev, isActive: false }));
  }, [stopTicking]);

  // End session via sendBeacon (for beforeunload)
  const endSessionBeacon = useCallback(() => {
    const payload = JSON.stringify({
      action: "end",
      activeSeconds: activeSecondsRef.current,
    });
    // Use sendBeacon — goes to a dedicated endpoint that can handle it
    navigator.sendBeacon(
      "/api/work-sessions/beacon",
      new Blob([payload], { type: "application/json" }),
    );
  }, []);

  // Start session on mount
  useEffect(() => {
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;

    const startSession = async () => {
      try {
        const res = await fetch("/api/work-sessions", { method: "POST" });
        if (!res.ok) return;
        const data = await res.json();
        const session = data.session;
        if (session) {
          activeSecondsRef.current = session.active_seconds ?? 0;
          setState({
            sessionId: session.id,
            loginTime: session.login_time,
            activeSeconds: session.active_seconds ?? 0,
            isActive: true,
          });
          startTicking();

          // Start heartbeat
          heartbeatIntervalRef.current = setInterval(() => {
            void sendHeartbeat();
            setState((prev) => ({
              ...prev,
              activeSeconds: activeSecondsRef.current,
            }));
          }, HEARTBEAT_INTERVAL_MS);
        }
      } catch {
        // Silently fail
      }
    };

    void startSession();

    // Visibility change — pause/resume tracking
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        lastTickRef.current = Date.now();
      }
    };

    // Before unload — end session via beacon
    const handleBeforeUnload = () => {
      endSessionBeacon();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopTicking();
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [startTicking, stopTicking, sendHeartbeat, endSessionBeacon]);

  return {
    ...state,
    activeSeconds: activeSecondsRef.current,
    endSession,
  };
}
