-- Optimized index for calls listing (covers agent filter + soft delete + sort)
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_started
  ON public.call_logs (agent_id, started_at DESC)
  WHERE deleted_at IS NULL;

-- Status-only filtered queries
CREATE INDEX IF NOT EXISTS idx_call_logs_status_started
  ON public.call_logs (status, started_at DESC)
  WHERE deleted_at IS NULL;
