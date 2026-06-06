-- Messages table for internal CRM chat
-- Supports Admin ↔ Agent messaging with strict isolation

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 4000),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversations table to group messages between two users
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one UUID NOT NULL REFERENCES auth.users(id),
  participant_two UUID NOT NULL REFERENCES auth.users(id),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (participant_one, participant_two)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_one ON public.conversations(participant_one);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_two ON public.conversations(participant_two);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Messages RLS: user can only see messages they sent or received
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can insert own messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

CREATE POLICY "Users can update own received messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() = receiver_id
  );

-- Conversations RLS: user can only see conversations they're part of
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant_one OR auth.uid() = participant_two
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_one OR auth.uid() = participant_two
  );

CREATE POLICY "Participants can update conversation" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = participant_one OR auth.uid() = participant_two
  );

-- Admin override: admins can see all messages and conversations
-- (Handled at application level since Supabase RLS doesn't have role awareness
--  without custom claims. The service_role key used server-side bypasses RLS.)
