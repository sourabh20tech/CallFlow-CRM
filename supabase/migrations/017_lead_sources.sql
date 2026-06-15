-- Lead Sources table for custom source management
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_sources_sort ON public.lead_sources(sort_order);
CREATE INDEX IF NOT EXISTS idx_lead_sources_value ON public.lead_sources(value);

ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sources" ON public.lead_sources
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert sources" ON public.lead_sources
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update sources" ON public.lead_sources
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete sources" ON public.lead_sources
  FOR DELETE USING (public.is_admin());

-- Seed defaults
INSERT INTO public.lead_sources (label, value, sort_order, is_system) VALUES
  ('Standard', 'standard', 1, true),
  ('Premium', 'premium', 2, true),
  ('Enterprise', 'enterprise', 3, true)
ON CONFLICT (value) DO NOTHING;

NOTIFY pgrst, 'reload schema';
