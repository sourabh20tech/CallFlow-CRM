-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  Run THIS in Supabase SQL Editor to enable Custom Lead Statuses            ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

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

-- Everyone can read
DROP POLICY IF EXISTS "Anyone can view statuses" ON public.lead_statuses;
CREATE POLICY "Anyone can view statuses" ON public.lead_statuses
  FOR SELECT USING (true);

-- Admins can manage
DROP POLICY IF EXISTS "Admins can insert statuses" ON public.lead_statuses;
CREATE POLICY "Admins can insert statuses" ON public.lead_statuses
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update statuses" ON public.lead_statuses;
CREATE POLICY "Admins can update statuses" ON public.lead_statuses
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete statuses" ON public.lead_statuses;
CREATE POLICY "Admins can delete statuses" ON public.lead_statuses
  FOR DELETE USING (public.is_admin());

-- Seed system defaults
INSERT INTO public.lead_statuses (label, value, color, sort_order, is_system) VALUES
  ('New', 'new', '#3b82f6', 1, true),
  ('Interested', 'interested', '#8b5cf6', 2, true),
  ('Follow-Up', 'follow_up', '#f59e0b', 3, true),
  ('Converted', 'converted', '#10b981', 4, true),
  ('Not Interested', 'not_interested', '#ef4444', 5, true),
  ('Closed', 'closed', '#6b7280', 6, true)
ON CONFLICT (value) DO NOTHING;

NOTIFY pgrst, 'reload schema';

-- ✅ Done! Now go to your CRM → Lead table → Click any status → You'll see "+ Add New Status" at the bottom.
