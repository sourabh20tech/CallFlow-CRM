import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { requireAdminApi } from "@/lib/api/require-admin";
import { leadStatusesDbServiceServer } from "@/services/db/lead-statuses.service";

/** GET /api/lead-statuses — List all statuses (available to all authenticated users) */
export async function GET() {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  try {
    const statuses = await leadStatusesDbServiceServer.list();
    return NextResponse.json({ statuses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load statuses";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/lead-statuses — Create a custom status (admin only) */
export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { label, color } = body as { label?: string; color?: string };
  if (!label?.trim()) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  try {
    const status = await leadStatusesDbServiceServer.create(
      { label, color },
      auth.user.id,
    );
    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
