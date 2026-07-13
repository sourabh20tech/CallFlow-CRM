-- Dashboard Stats table + refresh RPC (used by admin dashboard and reports)

-- Table for caching computed KPIs
CREATE TABLE IF NOT EXISTS public.dashboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL DEFAULT 'global',
  agent_id UUID REFERENCES public.agents(id),
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_leads INTEGER NOT NULL DEFAULT 0,
  converted_leads INTEGER NOT NULL DEFAULT 0,
  pending_followups INTEGER NOT NULL DEFAULT 0,
  total_calls INTEGER NOT NULL DEFAULT 0,
  active_agents INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scope, agent_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_stats_scope
  ON public.dashboard_stats(scope, stat_date);

-- RPC: refresh_dashboard_stats
-- Computes live KPIs and upserts into dashboard_stats for caching
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats(p_stat_date DATE DEFAULT CURRENT_DATE)
RETURNS public.dashboard_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.dashboard_stats;
  v_total_leads INTEGER;
  v_converted_leads INTEGER;
  v_pending_followups INTEGER;
  v_total_calls INTEGER;
  v_active_agents INTEGER;
  v_conversion_rate NUMERIC(5,2);
BEGIN
  SELECT count(*)::int INTO v_total_leads
    FROM public.leads WHERE deleted_at IS NULL;

  SELECT count(*)::int INTO v_converted_leads
    FROM public.leads WHERE status = 'converted' AND deleted_at IS NULL;

  v_pending_followups := 0;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'follow_ups' AND table_type = 'BASE TABLE'
    ) THEN
      EXECUTE 'SELECT count(*)::int FROM public.follow_ups WHERE status IN (''pending'',''in_progress'') AND deleted_at IS NULL'
        INTO v_pending_followups;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_pending_followups := 0;
  END;

  SELECT count(*)::int INTO v_total_calls
    FROM public.call_logs WHERE deleted_at IS NULL;

  SELECT count(*)::int INTO v_active_agents
    FROM public.agents WHERE is_active = true AND deleted_at IS NULL;

  v_conversion_rate := CASE WHEN v_total_leads > 0
    THEN round((v_converted_leads::numeric / v_total_leads) * 100, 2)
    ELSE 0 END;

  INSERT INTO public.dashboard_stats (scope, agent_id, stat_date, total_leads, converted_leads, pending_followups, total_calls, active_agents, conversion_rate, metrics)
  VALUES ('global', NULL, p_stat_date, v_total_leads, v_converted_leads, v_pending_followups, v_total_calls, v_active_agents, v_conversion_rate, jsonb_build_object('refreshed_at', now()::text))
  ON CONFLICT (scope, agent_id, stat_date) DO UPDATE SET
    total_leads = EXCLUDED.total_leads,
    converted_leads = EXCLUDED.converted_leads,
    pending_followups = EXCLUDED.pending_followups,
    total_calls = EXCLUDED.total_calls,
    active_agents = EXCLUDED.active_agents,
    conversion_rate = EXCLUDED.conversion_rate,
    metrics = EXCLUDED.metrics,
    updated_at = now()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

NOTIFY pgrst, 'reload schema';
