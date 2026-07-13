-- CallFlow CRM — Performance Composite Indexes (safe/idempotent)

DO $$ BEGIN
  -- Leads: Agent's assigned leads
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leads_agent_active ON public.leads (assigned_agent_id, created_at DESC) WHERE deleted_at IS NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leads_phone_active ON public.leads (phone) WHERE deleted_at IS NULL AND phone IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leads_email_active ON public.leads (email) WHERE deleted_at IS NULL AND email IS NOT NULL';
  END IF;

  -- Call Logs: Agent's today calls
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_call_logs_agent_active ON public.call_logs (agent_id, started_at DESC) WHERE deleted_at IS NULL';
  END IF;

  -- Follow-ups: Agent's pending follow-ups
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='follow_ups' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_followups_agent_status ON public.follow_ups (assigned_agent_id, status, due_at) WHERE deleted_at IS NULL';
  END IF;

  -- Notifications
  IF to_regclass('public.notifications') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications (recipient_id, is_read) WHERE is_read = false';
  END IF;

  -- Activity Logs
  IF to_regclass('public.activity_logs') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_logs' AND column_name='deleted_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_activity_logs_recent ON public.activity_logs (created_at DESC) WHERE deleted_at IS NULL';
    ELSE
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_activity_logs_recent ON public.activity_logs (created_at DESC)';
    END IF;
  END IF;
END $$;
