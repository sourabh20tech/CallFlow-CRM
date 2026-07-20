-- Remove old duplicate policies that co-exist with new ones
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.work_sessions;
DROP POLICY IF EXISTS "Authenticated users can create notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Authors can update own notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can view relevant notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Anyone can view sources" ON public.lead_sources;
DROP POLICY IF EXISTS "Anyone can view statuses" ON public.lead_statuses;

NOTIFY pgrst, 'reload schema';
