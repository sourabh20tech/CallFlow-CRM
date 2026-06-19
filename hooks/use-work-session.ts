"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const HEARTBEAT_INTERVAL_MS = 60_000; // 60s

// ─── Singleton session manager ───────────────────────────────────────────────
// Ensures only one session is started regardless of how many components use the hook.

interface SessionState {
  sessionId: string | null;
  loginTime: string | null;
  activeSeconds: number;
  isActive: boolean;
}

let globalState: SessionState = {
  sessionId: null,
  loginTime: null,
  activeSeconds: 0,
  isActive: false,
};

let listeners: Set<() => void> = new Set();
let initialized = false;
let activeSecondsCounter = 0;
let isVisible = typeof document !== "undefined" ? !document.hidden : true;
let lastTick = Date.now();
let tickTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function notify() {
  listeners.forEach((l) => l());
}

function setState(partial: Partial<SessionState>) {
  globalState = { ...globalState, ...partial };
  notify();
}

function startTicking() {
  if (tickTimer) return;
  lastTick = Date.now();
  tickTimer = setInterval(() => {
    if (isVisible) {
      const now = Date.now();
      const delta = Math.floor((now - lastTick) / 1000);
      if (delta > 0 && delta < 5) {
        activeSecondsCounter += delta;
        // Update state every 5 ticks to avoid excessive re-renders
        if (activeSecondsCounter % 5 === 0 || delta >= 2) {
          setState({ activeSeconds: activeSecondsCounter });
        }
      }
      lastTick = now;
    } else {
      lastTick = Date.now();
    }
  }, 1000);
}

function stopTicking() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

async function sendHeartbeat() {
  try {
    await fetch("/api/work-sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "heartbeat", activeSeconds: activeSecondsCounter }),
    });
  } catch {}
}

function endSessionBeacon() {
  const payload = JSON.stringify({ action: "end", activeSeconds: activeSecondsCounter });
  navigator.sendBeacon(
    "/api/work-sessions/beacon",
    new Blob([payload], { type: "application/json" }),
  );
}

async function initSession() {
  if (initialized) return;
  initialized = true;

  try {
    const res = await fetch("/api/work-sessions", { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    const session = data.session;
    if (session) {
      activeSecondsCounter = session.active_seconds ?? 0;
      setState({
        sessionId: session.id,
        loginTime: session.login_time,
        activeSeconds: activeSecondsCounter,
        isActive: true,
      });
      startTicking();

      heartbeatTimer = setInterval(() => {
        void sendHeartbeat();
        setState({ activeSeconds: activeSecondsCounter });
      }, HEARTBEAT_INTERVAL_MS);
    }
  } catch {}

  // Visibility tracking
  const handleVisibility = () => {
    isVisible = !document.hidden;
    if (!document.hidden) {
      lastTick = Date.now();
    }
  };

  const handleBeforeUnload = () => {
    endSessionBeacon();
  };

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("beforeunload", handleBeforeUnload);
}

async function endSessionGlobal() {
  stopTicking();
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  try {
    await fetch("/api/work-sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end", activeSeconds: activeSecondsCounter }),
    });
  } catch {}

  setState({ isActive: false });
  initialized = false; // Allow re-init on next login
}

// ─── External store for React ────────────────────────────────────────────────

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot(): SessionState {
  return globalState;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWorkSession() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    void initSession();
  }, []);

  const endSession = useCallback(async () => {
    await endSessionGlobal();
  }, []);

  return {
    ...state,
    // Always return the live counter for display purposes
    activeSeconds: activeSecondsCounter,
    endSession,
  };
}
