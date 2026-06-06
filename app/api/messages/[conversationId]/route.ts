import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { messagesDbServiceServer } from "@/services/db/messages.service";

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

/**
 * GET /api/messages/:conversationId - Get messages in a conversation.
 * Validates the user is a participant (agents) or admin.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { conversationId } = await params;
  const isAdmin = auth.user.role === "admin";

  try {
    const messages = await messagesDbServiceServer.getMessages(
      conversationId,
      auth.user.id,
      isAdmin,
    );

    // Mark messages as read for the current user
    await messagesDbServiceServer.markAsRead(conversationId, auth.user.id);

    return NextResponse.json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load messages";
    const status = message.includes("Access denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
