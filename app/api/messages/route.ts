import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { messagesDbServiceServer } from "@/services/db/messages.service";

/**
 * GET /api/messages - List conversations for the authenticated user.
 * Agents only see their own conversations. Admins see all.
 */
export async function GET() {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  try {
    const isAdmin = auth.user.role === "admin";
    const conversations = await messagesDbServiceServer.getConversations(
      auth.user.id,
      isAdmin,
    );

    // Resolve participant names
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const participantIds = new Set<string>();
    for (const conv of conversations) {
      participantIds.add(conv.participantOne);
      participantIds.add(conv.participantTwo);
    }

    const names: Record<string, string> = {};
    if (participantIds.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(participantIds));

      for (const p of profiles ?? []) {
        names[p.id] = p.full_name ?? "User";
      }
    }

    const enriched = conversations.map((conv) => ({
      ...conv,
      participantOneName: names[conv.participantOne] ?? "User",
      participantTwoName: names[conv.participantTwo] ?? "User",
      otherParticipantId:
        conv.participantOne === auth.user.id ? conv.participantTwo : conv.participantOne,
      otherParticipantName:
        conv.participantOne === auth.user.id
          ? (names[conv.participantTwo] ?? "User")
          : (names[conv.participantOne] ?? "User"),
    }));

    return NextResponse.json({ conversations: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load conversations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/messages - Send a new message.
 * Agent can only message admin. Admin can message anyone.
 */
export async function POST(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { receiverId, content } = body as { receiverId?: string; content?: string };

  if (!receiverId || !content?.trim()) {
    return NextResponse.json(
      { error: "receiverId and content are required" },
      { status: 400 },
    );
  }

  // Agent permission check: agents can only message admins
  if (auth.user.role === "agent") {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: receiverProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", receiverId)
      .maybeSingle();

    if (!receiverProfile || receiverProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Agents can only send messages to admins" },
        { status: 403 },
      );
    }
  }

  try {
    const message = await messagesDbServiceServer.sendMessage(auth.user.id, {
      receiverId,
      content,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
