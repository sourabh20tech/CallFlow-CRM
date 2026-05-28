"use client";

import { LeadNotesPanel as SharedLeadNotesPanel } from "@/components/leads/lead-notes-panel";

interface LeadNotesPanelProps {
  leadId: string;
  className?: string;
  readOnly?: boolean;
  onNoteAdded?: () => void;
}

export function LeadNotesPanel({
  leadId,
  className,
  readOnly = false,
  onNoteAdded,
}: LeadNotesPanelProps) {
  return (
    <SharedLeadNotesPanel
      leadId={leadId}
      apiBase="/api/agent/leads"
      className={className}
      readOnly={readOnly}
      onNoteAdded={onNoteAdded}
      composerLabel="Add note"
      submitLabel="Save note"
      emptyLabel={readOnly ? "No notes on file." : "No notes yet."}
      historyLabel="Notes history"
      maxListHeightClassName="max-h-56 overflow-y-auto scrollbar-thin pr-1"
    />
  );
}
