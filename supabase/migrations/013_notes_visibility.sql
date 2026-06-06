-- Add note_type column for public/internal note visibility
-- Internal notes are visible only to admins

ALTER TABLE public.lead_notes
  ADD COLUMN IF NOT EXISTS note_type TEXT NOT NULL DEFAULT 'public'
  CHECK (note_type IN ('public', 'internal'));

-- Index for filtering by note type
CREATE INDEX IF NOT EXISTS idx_lead_notes_note_type ON public.lead_notes(note_type);

-- RLS policies for lead_notes (if not already enabled)
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select notes they authored or that are on their assigned leads
CREATE POLICY "Users can view relevant notes" ON public.lead_notes
  FOR SELECT USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.agents a ON a.id = l.assigned_agent_id
      WHERE l.id = lead_notes.lead_id
        AND a.profile_id = auth.uid()
        AND lead_notes.deleted_at IS NULL
    )
  );

-- Allow authenticated users to insert notes
CREATE POLICY "Authenticated users can create notes" ON public.lead_notes
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
  );

-- Allow authors and admins to update notes
CREATE POLICY "Authors can update own notes" ON public.lead_notes
  FOR UPDATE USING (
    auth.uid() = author_id
  );

-- Note: Admin access is handled server-side via service_role key which bypasses RLS.
-- Internal notes are filtered at the application layer: agents never receive internal notes.
