import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api/require-admin";
import { leadStatusesDbServiceServer } from "@/services/db/lead-statuses.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** PATCH /api/lead-statuses/:id — Update a status (admin only) */
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { label, color, sortOrder } = body as { label?: string; color?: string; sortOrder?: number };

  try {
    const status = await leadStatusesDbServiceServer.update(id, { label, color, sortOrder });
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** DELETE /api/lead-statuses/:id — Delete a custom status (admin only) */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    await leadStatusesDbServiceServer.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
