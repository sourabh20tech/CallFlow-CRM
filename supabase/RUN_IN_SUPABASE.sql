-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  CallFlow CRM — Complete New Schema Changes                                ║
-- ║  Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New query) ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
--
-- Prerequisites: Migrations 001-011 must already be applied.
-- This file contains ONLY the new tables and columns added during recent updates.
--
-- Changes included:
--   1. note_type column on lead_notes (public/internal notes)
--   2. dashboard_stats table for reports caching
--   3. Soft delete support columns
--   4. refresh_dashboard_stats RPC function
--   5. Custom lead_statuses table
--   6. Activity logs table
--


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1: NOTE VISIBILITY (note_type column on lead_notes)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 2A. Add note_type column (public or internal)
ALTER TABLE public.lead_notes
  ADD COLUMN IF NOT EXISTS note_type TEXT NOT NULL DEFAULT 'public';

-- Add constraint if not exists (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_notes_note_type_check'
  ) THEN
    ALTER TABLE public.lead_notes
      ADD CONSTRAINT lead_notes_note_type_check
      CHECK (note_type IN ('public', 'internal'));
  END IF;
END $$;

-- 2B. Index for filtering by note type
CREATE INDEX IF NOT EXISTS idx_lead_notes_note_type ON public.lead_notes(note_type);


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2: DASHBOARD STATS TABLE (for reports/analytics caching)
-- ═══════════════════════════════════════════════════════════════════════════════

-- This table may already exist from previous migrations. Create only if missing.
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

CREATE INDEX IF NOT EXISTS idx_dashboard_stats_scope ON public.dashboard_stats(scope, stat_date);


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 3: SOFT DELETE SUPPORT (deleted_at on all core tables)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure deleted_at exists on all relevant tables (idempotent)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Follow-ups table (the actual table is follow_ups; followups is a view)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'follow_ups' AND table_type = 'BASE TABLE'
  ) THEN
    EXECUTE 'ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ';
  END IF;
END $$;

-- Partial indexes for soft-delete queries (only index non-deleted rows)
CREATE INDEX IF NOT EXISTS idx_leads_not_deleted ON public.leads(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_not_deleted ON public.call_logs(id) WHERE deleted_at IS NULL;

-- Next follow-up date on leads (used by lead management)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 4: REFRESH DASHBOARD STATS RPC (used by reports)
-- ═══════════════════════════════════════════════════════════════════════════════

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

  -- Pending follow-ups (table is follow_ups; followups is a view)
  v_pending_followups := 0;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'follow_ups' AND table_type = 'BASE TABLE'
    ) THEN
      EXECUTE 'SELECT count(*)::int FROM public.follow_ups WHERE status IN (''pending'',''in_progress'') AND (deleted_at IS NULL)'
        INTO v_pending_followups;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_pending_followups := 0;
  END;

  SELECT count(*)::int INTO v_total_calls
    FROM public.call_logs WHERE deleted_at IS NULL;

  SELECT count(*)::int INTO v_active_agents
    FROM public.agents WHERE is_active = true AND (deleted_at IS NULL);

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


-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! Notify PostgREST to reload schema cache.
-- ═══════════════════════════════════════════════════════════════════════════════

NOTIFY pgrst, 'reload schema';


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 5: CUSTOM LEAD STATUSES TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lead_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_statuses_sort ON public.lead_statuses(sort_order);
CREATE INDEX IF NOT EXISTS idx_lead_statuses_value ON public.lead_statuses(value);

ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;

-- Everyone can read statuses
DROP POLICY IF EXISTS "Anyone can view statuses" ON public.lead_statuses;
CREATE POLICY "Anyone can view statuses" ON public.lead_statuses
  FOR SELECT USING (true);

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage statuses" ON public.lead_statuses;
CREATE POLICY "Admins can insert statuses" ON public.lead_statuses
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update statuses" ON public.lead_statuses
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete statuses" ON public.lead_statuses
  FOR DELETE USING (public.is_admin());

-- Seed default system statuses
INSERT INTO public.lead_statuses (label, value, color, sort_order, is_system) VALUES
  ('New', 'new', '#3b82f6', 1, true),
  ('Interested', 'interested', '#8b5cf6', 2, true),
  ('Follow-Up', 'follow_up', '#f59e0b', 3, true),
  ('Converted', 'converted', '#10b981', 4, true),
  ('Not Interested', 'not_interested', '#ef4444', 5, true),
  ('Closed', 'closed', '#6b7280', 6, true)
ON CONFLICT (value) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 6: ACTIVITY LOGS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'agent',
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all logs" ON public.activity_logs;
CREATE POLICY "Admins can view all logs" ON public.activity_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own logs" ON public.activity_logs;
CREATE POLICY "Users can view own logs" ON public.activity_logs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! Notify PostgREST to reload schema cache.
-- ═══════════════════════════════════════════════════════════════════════════════

NOTIFY pgrst, 'reload schema';
