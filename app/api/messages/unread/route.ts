import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { messagesDbServiceServer } from "@/services/db/messages.service";

/**
 * GET /api/messages/unread - Get unread message count for the authenticated user.
 */
export async function GET() {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  try {
    const count = await messagesDbServiceServer.getUnreadCount(auth.user.id);
    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    return NextResponse.json({ unreadCount: 0 });
  }
}
