export type NoteType = "public" | "internal";
export type NoteVisibility = "private" | "shared";

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
  visibility: NoteVisibility;
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
  visibility?: NoteVisibility;
}

export interface UpdateNoteInput {
  content?: string;
  isPinned?: boolean;
  noteType?: NoteType;
  visibility?: NoteVisibility;
}
