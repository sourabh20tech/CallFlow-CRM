-- CallFlow CRM — Performance Composite Indexes
-- These indexes optimize the most common filtered queries.
-- Safe to run on production (CREATE INDEX IF NOT EXISTS is non-blocking on modern PG).

-- Leads: Agent's assigned leads (most common agent query)
CREATE INDEX IF NOT EXISTS idx_leads_agent_active
  ON public.leads (assigned_agent_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Call Logs: Agent's today calls
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_active
  ON public.call_logs (agent_id, started_at DESC)
  WHERE deleted_at IS NULL;

-- Follow-ups: Agent's pending follow-ups
CREATE INDEX IF NOT EXISTS idx_followups_agent_status
  ON public.follow_ups (assigned_agent_id, status, due_at)
  WHERE deleted_at IS NULL;

-- Notifications: User's unread count (polled every 60s)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications (recipient_id, is_read)
  WHERE is_read = false;

-- Activity Logs: Recent logs listing
CREATE INDEX IF NOT EXISTS idx_activity_logs_recent
  ON public.activity_logs (created_at DESC)
  WHERE deleted_at IS NULL;

-- Leads: Phone lookup for bulk import duplicate detection
CREATE INDEX IF NOT EXISTS idx_leads_phone_active
  ON public.leads (phone)
  WHERE deleted_at IS NULL AND phone IS NOT NULL;

-- Leads: Email lookup for bulk import duplicate detection
CREATE INDEX IF NOT EXISTS idx_leads_email_active
  ON public.leads (email)
  WHERE deleted_at IS NULL AND email IS NOT NULL;
