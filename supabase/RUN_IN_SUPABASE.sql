-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  CallFlow CRM — Complete New Schema Changes                                ║
-- ║  Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New query) ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
--
-- Prerequisites: Migrations 001-011 must already be applied.
-- This file contains ONLY the new tables and columns added during recent updates.
--
-- Changes included:
--   1. Messages & Conversations tables (internal chat system)
--   2. note_type column on lead_notes (public/internal notes)
--

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1: MESSAGING SYSTEM (conversations + messages)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1A. Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one UUID NOT NULL REFERENCES auth.users(id),
  participant_two UUID NOT NULL REFERENCES auth.users(id),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (participant_one, participant_two)
);

-- 1B. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 4000),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1C. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_conversations_participant_one ON public.conversations(participant_one);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_two ON public.conversations(participant_two);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- 1D. Row Level Security — Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can insert own messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

CREATE POLICY "Users can update own received messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() = receiver_id
  );

-- 1E. Row Level Security — Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant_one OR auth.uid() = participant_two
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_one OR auth.uid() = participant_two
  );

CREATE POLICY "Participants can update conversation" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = participant_one OR auth.uid() = participant_two
  );

-- 1F. Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_updated_at ON public.messages;
CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2: NOTE VISIBILITY (note_type column on lead_notes)
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
-- PART 3: DASHBOARD STATS TABLE (for reports/analytics caching)
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
-- PART 4: SOFT DELETE SUPPORT (deleted_at on all core tables)
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
-- PART 5: REFRESH DASHBOARD STATS RPC (used by reports)
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
