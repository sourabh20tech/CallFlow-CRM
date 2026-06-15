-- Work Sessions table for agent time tracking
CREATE TABLE IF NOT EXISTS public.work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  user_id UUID NOT NULL,
  login_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  logout_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_sessions_agent ON public.work_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_user ON public.work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_login ON public.work_sessions(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_work_sessions_active ON public.work_sessions(is_active) WHERE is_active = true;

ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all sessions" ON public.work_sessions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can view own sessions" ON public.work_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert" ON public.work_sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own sessions" ON public.work_sessions
  FOR UPDATE USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
