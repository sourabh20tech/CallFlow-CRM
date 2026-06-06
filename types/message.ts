export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  senderName?: string;
  receiverName?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantOne: string;
  participantTwo: string;
  participantOneName?: string;
  participantTwoName?: string;
  lastMessageAt: string;
  lastMessagePreview?: string;
  unreadCount: number;
  createdAt: string;
}

export interface SendMessageInput {
  receiverId: string;
  content: string;
}

export interface ConversationWithMeta extends Conversation {
  otherParticipantName: string;
  otherParticipantId: string;
}
