import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { isNotFoundError, toDbError } from "@/lib/db/errors";
import { followupsService } from "@/services/followups.service";
import { updateFollowupSchema } from "@/utils/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;
  const followup = await followupsService.getById(id);

  if (!followup) {
    return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
  }

  return NextResponse.json(followup);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateFollowupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const payload = {
      ...parsed.data,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : undefined,
    };
    const followup = await followupsService.update(id, payload);
    return NextResponse.json(followup);
  } catch (error) {
    const message = toDbError(error, "Failed to update follow-up").message;
    console.error("[api/followups/:id] PATCH failed:", error);
    return NextResponse.json({ error: message }, { status: isNotFoundError(error) ? 404 : 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    await followupsService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = toDbError(error, "Failed to delete follow-up").message;
    console.error("[api/followups/:id] DELETE failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
