export type NoteType = "public" | "internal";

export interface Note {
  id: string;
  leadId?: string;
  callLogId?: string;
  followupId?: string;
  authorId: string;
  authorName?: string;
  authorAvatarUrl?: string;
  content: string;
  noteType: NoteType;
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
  noteType?: NoteType;
}

export interface UpdateNoteInput {
  content?: string;
  isPinned?: boolean;
  noteType?: NoteType;
}
