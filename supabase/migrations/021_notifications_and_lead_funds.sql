-- Notifications table (bell icon notifications for agents)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (recipient_id = auth.uid());
CREATE POLICY "Authenticated can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Lead Funds table (revenue tracking per lead)
CREATE TABLE IF NOT EXISTS public.lead_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_funds_lead ON public.lead_funds(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_funds_agent ON public.lead_funds(agent_id);
CREATE INDEX IF NOT EXISTS idx_lead_funds_created ON public.lead_funds(created_at DESC);

ALTER TABLE public.lead_funds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all funds" ON public.lead_funds
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Agents can view own funds" ON public.lead_funds
  FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "Authenticated can insert funds" ON public.lead_funds
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete funds" ON public.lead_funds
  FOR DELETE USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
