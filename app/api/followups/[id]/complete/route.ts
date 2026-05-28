import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { isNotFoundError, toDbError } from "@/lib/db/errors";
import { followupsService } from "@/services/followups.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const followup = await followupsService.complete(id);
    return NextResponse.json(followup);
  } catch (error) {
    const message = toDbError(error, "Failed to complete follow-up").message;
    console.error("[api/followups/:id/complete] POST failed:", error);
    return NextResponse.json({ error: message }, { status: isNotFoundError(error) ? 404 : 500 });
  }
}
