import { BaseDbService } from "@/services/db/base.service";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";
import type { Message, Conversation, SendMessageInput } from "@/types/message";

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface ConversationRow {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

function mapMessageRow(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

function mapConversationRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    participantOne: row.participant_one,
    participantTwo: row.participant_two,
    lastMessageAt: row.last_message_at,
    unreadCount: 0,
    createdAt: row.created_at,
  };
}

export class MessagesDbService extends BaseDbService {
  /**
   * Get conversations for a user.
   * Admins can see all conversations; agents only see their own.
   */
  async getConversations(
    userId: string,
    isAdmin: boolean,
    client?: TypedSupabaseClient,
  ): Promise<Conversation[]> {
    const supabase = await this.db(client);

    let query = (supabase as any)
      .from("conversations")
      .select("*")
      .order("last_message_at", { ascending: false });

    if (!isAdmin) {
      query = query.or(`participant_one.eq.${userId},participant_two.eq.${userId}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const conversations = ((data ?? []) as ConversationRow[]).map(mapConversationRow);

    // Fetch unread counts for each conversation
    for (const conv of conversations) {
      const { count } = await (supabase as any)
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("receiver_id", userId)
        .eq("is_read", false);

      conv.unreadCount = count ?? 0;
    }

    // Fetch last message preview
    for (const conv of conversations) {
      const { data: lastMsg } = await (supabase as any)
        .from("messages")
        .select("content")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMsg) {
        (conv as Conversation & { lastMessagePreview?: string }).lastMessagePreview =
          (lastMsg as { content: string }).content.length > 50
            ? (lastMsg as { content: string }).content.slice(0, 50) + "…"
            : (lastMsg as { content: string }).content;
      }
    }

    return conversations;
  }

  /**
   * Get messages in a conversation.
   * Validates the user is a participant (unless admin).
   */
  async getMessages(
    conversationId: string,
    userId: string,
    isAdmin: boolean,
    client?: TypedSupabaseClient,
  ): Promise<Message[]> {
    const supabase = await this.db(client);

    // Verify access
    if (!isAdmin) {
      const { data: conv } = await (supabase as any)
        .from("conversations")
        .select("participant_one, participant_two")
        .eq("id", conversationId)
        .maybeSingle();

      if (!conv || (conv.participant_one !== userId && conv.participant_two !== userId)) {
        throw new Error("Access denied: not a participant of this conversation");
      }
    }

    const { data, error } = await (supabase as any)
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) throw new Error(error.message);
    return ((data ?? []) as MessageRow[]).map(mapMessageRow);
  }

  /**
   * Send a message. Creates conversation if it doesn't exist.
   */
  async sendMessage(
    senderId: string,
    input: SendMessageInput,
    client?: TypedSupabaseClient,
  ): Promise<Message> {
    const supabase = await this.db(client);
    const { receiverId, content } = input;

    if (!content.trim()) throw new Error("Message content is required");
    if (senderId === receiverId) throw new Error("Cannot send message to yourself");

    // Find or create conversation
    const conversationId = await this.findOrCreateConversation(
      senderId,
      receiverId,
      supabase,
    );

    // Insert message
    const { data, error } = await (supabase as any)
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content: content.trim(),
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    // Update conversation last_message_at
    await (supabase as any)
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return mapMessageRow(data as MessageRow);
  }

  /**
   * Mark messages as read in a conversation for the current user.
   */
  async markAsRead(
    conversationId: string,
    userId: string,
    client?: TypedSupabaseClient,
  ): Promise<void> {
    const supabase = await this.db(client);

    await (supabase as any)
      .from("messages")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("receiver_id", userId)
      .eq("is_read", false);
  }

  /**
   * Get total unread count for a user across all conversations.
   */
  async getUnreadCount(userId: string, client?: TypedSupabaseClient): Promise<number> {
    const supabase = await this.db(client);

    const { count, error } = await (supabase as any)
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("is_read", false);

    if (error) return 0;
    return count ?? 0;
  }

  /**
   * Find existing conversation between two users, or create one.
   */
  private async findOrCreateConversation(
    userA: string,
    userB: string,
    supabase: TypedSupabaseClient,
  ): Promise<string> {
    // Normalize participant order
    const [p1, p2] = [userA, userB].sort();

    const { data: existing } = await (supabase as any)
      .from("conversations")
      .select("id")
      .eq("participant_one", p1)
      .eq("participant_two", p2)
      .maybeSingle();

    if (existing) return (existing as { id: string }).id;

    // Also check reverse order (in case of non-normalized data)
    const { data: existingReverse } = await (supabase as any)
      .from("conversations")
      .select("id")
      .eq("participant_one", p2)
      .eq("participant_two", p1)
      .maybeSingle();

    if (existingReverse) return (existingReverse as { id: string }).id;

    // Create new conversation
    const { data: created, error } = await (supabase as any)
      .from("conversations")
      .insert({ participant_one: p1, participant_two: p2 })
      .select("id")
      .single();

    if (error) throw new Error(`Failed to create conversation: ${error.message}`);
    return (created as { id: string }).id;
  }
}

export const messagesDbService = new MessagesDbService("browser");
export const messagesDbServiceServer = new MessagesDbService("server");
