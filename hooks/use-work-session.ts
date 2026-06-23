"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Work Session Tracking — Call Center Mode
 * 
 * Architecture:
 * - Timer counts ALL time from login to logout (not just tab-visible time).
 * - Agents work across CRM, WhatsApp, phone calls — all counts as work.
 * - Heartbeat every 30s keeps session alive and syncs active_seconds to DB.
 * - Daily reset: server handles date boundaries.
 * - On page refresh: server resumes existing session.
 * - On logout/browser close: final seconds sent to close session.
 */

const HEARTBEAT_MS = 30_000; // 30 seconds

// ─── Module-level singleton state ────────────────────────────────────────────

let _initialized = false;
let _sessionId: string | null = null;
let _loginTime: string | null = null;
let _isActive = false;
let _activeSeconds = 0;
let _lastTickMs = Date.now();
let _tickTimer: ReturnType<typeof setInterval> | null = null;
let _heartbeatTimer: ReturnType<typeof setInterval> | null = null;

// ─── Core logic ──────────────────────────────────────────────────────────────

function tick() {
  if (!_isActive) return;

  const now = Date.now();
  const deltaMs = now - _lastTickMs;

  // Count all time while session is active (no visibility check).
  // Only reject huge gaps (> 5 min) which indicate sleep/suspend.
  if (deltaMs >= 900 && deltaMs < 300_000) {
    _activeSeconds += Math.round(deltaMs / 1000);
  } else if (deltaMs >= 300_000) {
    // After a long gap (sleep/laptop closed), just add 1 second to keep ticking
    _activeSeconds += 1;
  }
  _lastTickMs = now;
}

function startTicker() {
  if (_tickTimer) return;
  _lastTickMs = Date.now();
  _tickTimer = setInterval(tick, 1000);
}

function stopTicker() {
  if (_tickTimer) {
    clearInterval(_tickTimer);
    _tickTimer = null;
  }
}

async function heartbeat() {
  if (!_isActive) return;
  try {
    await fetch("/api/work-sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "heartbeat", activeSeconds: _activeSeconds }),
    });
  } catch {
    // Silent — will retry next interval
  }
}

function setupListeners() {
  const onBeforeUnload = () => {
    // Send final active_seconds via beacon (fire-and-forget)
    const payload = JSON.stringify({ action: "end", activeSeconds: _activeSeconds });
    navigator.sendBeacon(
      "/api/work-sessions/beacon",
      new Blob([payload], { type: "application/json" }),
    );
  };

  window.addEventListener("beforeunload", onBeforeUnload);
}

async function initialize() {
  if (_initialized) return;
  _initialized = true;

  try {
    const res = await fetch("/api/work-sessions", { method: "POST" });
    if (!res.ok) return;
    const { session } = await res.json();
    if (!session) return;

    _sessionId = session.id;
    _loginTime = session.login_time;
    _isActive = true;
    // Resume from DB value (critical for page refresh)
    _activeSeconds = session.active_seconds ?? 0;

    startTicker();
    _heartbeatTimer = setInterval(() => void heartbeat(), HEARTBEAT_MS);
    setupListeners();
  } catch {
    // Silent
  }
}

async function endSession() {
  if (!_isActive) return;

  stopTicker();
  if (_heartbeatTimer) {
    clearInterval(_heartbeatTimer);
    _heartbeatTimer = null;
  }

  try {
    await fetch("/api/work-sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end", activeSeconds: _activeSeconds }),
    });
  } catch {}

  _isActive = false;
  _initialized = false; // Allow re-init on next login
}

// ─── React Hook ──────────────────────────────────────────────────────────────

export function useWorkSession() {
  const initRef = useRef(false);
  const [, rerender] = useState(0);

  // Initialize once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    void initialize();
  }, []);

  // Re-render every second for live display when active
  useEffect(() => {
    if (!_isActive && !_sessionId) {
      const poll = setInterval(() => {
        if (_isActive) rerender((n) => n + 1);
      }, 500);
      const timeout = setTimeout(() => clearInterval(poll), 10_000);
      return () => { clearInterval(poll); clearTimeout(timeout); };
    }

    if (!_isActive) return;

    const timer = setInterval(() => rerender((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [_isActive, _sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    sessionId: _sessionId,
    loginTime: _loginTime,
    isActive: _isActive,
    activeSeconds: _isActive ? _activeSeconds : 0,
    endSession: useCallback(async () => { await endSession(); rerender((n) => n + 1); }, []),
  };
}
