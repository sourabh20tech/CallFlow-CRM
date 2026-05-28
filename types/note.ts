export interface Note {
  id: string;
  leadId?: string;
  callLogId?: string;
  followupId?: string;
  authorId: string;
  authorName?: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  content: string;
  leadId?: string;
  callLogId?: string;
  followupId?: string;
  isPinned?: boolean;
}

export interface UpdateNoteInput {
  content?: string;
  isPinned?: boolean;
}
