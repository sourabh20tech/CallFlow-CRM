-- Performance indexes for faster queries across the CRM

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON public.leads(assigned_agent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc ON public.leads(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_full_name_trgm ON public.leads USING gin(full_name gin_trgm_ops);

-- Follow-ups indexes
CREATE INDEX IF NOT EXISTS idx_followups_lead_id ON public.follow_ups(lead_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_followups_agent_id ON public.follow_ups(assigned_agent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_followups_due_at ON public.follow_ups(due_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_followups_status_active ON public.follow_ups(status) WHERE deleted_at IS NULL AND status IN ('pending', 'in_progress');

-- Call logs indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_id ON public.call_logs(agent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON public.call_logs(lead_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON public.call_logs(started_at DESC) WHERE deleted_at IS NULL;

-- Lead notes indexes
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lead_notes_author_id ON public.lead_notes(author_id) WHERE deleted_at IS NULL;

-- Agents indexes
CREATE INDEX IF NOT EXISTS idx_agents_profile_id ON public.agents(profile_id);
CREATE INDEX IF NOT EXISTS idx_agents_active ON public.agents(is_active) WHERE deleted_at IS NULL;

NOTIFY pgrst, 'reload schema';
