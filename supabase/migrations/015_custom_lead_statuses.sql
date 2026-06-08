-- Custom Lead Statuses table
-- Allows admin to create custom statuses beyond the defaults

CREATE TABLE IF NOT EXISTS public.lead_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_statuses_sort ON public.lead_statuses(sort_order);
CREATE INDEX IF NOT EXISTS idx_lead_statuses_value ON public.lead_statuses(value);

-- RLS
ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view statuses" ON public.lead_statuses
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage statuses" ON public.lead_statuses
  FOR ALL USING (public.is_admin());

-- Insert default system statuses
INSERT INTO public.lead_statuses (label, value, color, sort_order, is_system) VALUES
  ('New', 'new', '#3b82f6', 1, true),
  ('Interested', 'interested', '#8b5cf6', 2, true),
  ('Follow-Up', 'follow_up', '#f59e0b', 3, true),
  ('Converted', 'converted', '#10b981', 4, true),
  ('Not Interested', 'not_interested', '#ef4444', 5, true),
  ('Closed', 'closed', '#6b7280', 6, true)
ON CONFLICT (value) DO NOTHING;

-- Allow leads.status to hold any text value (remove enum constraint if exists)
-- The status column is already TEXT in the production schema after migration 003

NOTIFY pgrst, 'reload schema';
