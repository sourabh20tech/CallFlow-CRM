"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/design-system/glass-card";
import { PageHeader } from "@/components/design-system/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { pageSection } from "@/lib/design-system/styles";
import { cn } from "@/lib/utils";
import type { ConversationWithMeta, Message } from "@/types/message";

export function MessagesPage() {
  const { user, role } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationWithMeta | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      // silent fail on poll
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403) {
          toast.error("Access denied to this conversation");
          setActiveConversation(null);
          return;
        }
        throw new Error(data.error ?? "Failed to load");
      }
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Poll for new messages when viewing a conversation
  useEffect(() => {
    if (!activeConversation) return;
    void loadMessages(activeConversation.id);

    pollRef.current = setInterval(() => {
      void loadMessages(activeConversation.id);
      void loadConversations();
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConversation, loadMessages, loadConversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activeConversation.otherParticipantId,
          content: newMessage.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Send failed");
      }

      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      void loadConversations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send message");
    } finally {
      setIsSending(false);
    }
  };

  const openConversation = (conv: ConversationWithMeta) => {
    setActiveConversation(conv);
    setMessages([]);
  };

  return (
    <div className={pageSection}>
      <PageHeader
        title="Messages"
        description={role === "admin" ? "Chat with your team" : "Chat with admin"}
      />

      <div className="grid h-[calc(100dvh-14rem)] gap-4 lg:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <GlassCard
          variant="default"
          padding="none"
          className={cn(
            "flex flex-col overflow-hidden",
            activeConversation && "hidden lg:flex",
          )}
        >
          <div className="border-b border-border/40 px-4 py-3">
            <h3 className="text-sm font-semibold">Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/30" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/30">
                {conversations.map((conv) => (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => openConversation(conv)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30",
                        activeConversation?.id === conv.id && "bg-primary/10",
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary">
                        {conv.otherParticipantName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {conv.otherParticipantName}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.lastMessagePreview && (
                          <p className="truncate text-xs text-muted-foreground">
                            {conv.lastMessagePreview}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </GlassCard>

        {/* Messages panel */}
        <GlassCard
          variant="default"
          padding="none"
          className={cn(
            "flex flex-col overflow-hidden",
            !activeConversation && "hidden lg:flex",
          )}
        >
          {activeConversation ? (
            <>
              <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 lg:hidden"
                  onClick={() => setActiveConversation(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary">
                  {activeConversation.otherParticipantName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{activeConversation.otherParticipantName}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Send the first one!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn("flex", isMine ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                              isMine
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <p
                              className={cn(
                                "mt-1 text-[10px]",
                                isMine ? "text-primary-foreground/70" : "text-muted-foreground",
                              )}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-border/40 px-4 py-3"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  maxLength={4000}
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || isSending}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
