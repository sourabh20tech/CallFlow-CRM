-- Work sessions: fast lookup for active session check (called every 30s heartbeat)
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_active
  ON public.work_sessions (user_id, is_active)
  WHERE is_active = true;
