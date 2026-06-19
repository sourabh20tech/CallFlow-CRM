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
    // Get old value before update to rename in leads table
    const statuses = await leadStatusesDbServiceServer.list();
    const oldStatus = statuses.find((s) => s.id === id);
    const oldValue = oldStatus?.value;

    const status = await leadStatusesDbServiceServer.update(id, { label, color, sortOrder });

    // If value changed, update all leads using the old value
    if (label && oldValue && oldValue !== status.value) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      await (supabase as any)
        .from("leads")
        .update({ status: status.value })
        .eq("status", oldValue);
    }

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
    // Get the status value before deletion to reassign leads
    const statuses = await leadStatusesDbServiceServer.list();
    const statusToDelete = statuses.find((s) => s.id === id);
    const deletedValue = statusToDelete?.value;

    await leadStatusesDbServiceServer.delete(id);

    // Reassign leads using this status to "new"
    if (deletedValue) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      await (supabase as any)
        .from("leads")
        .update({ status: "new" })
        .eq("status", deletedValue);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
