import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api/require-admin";
import { dataManagementService } from "@/services/data-management.service";
import { trashListQuerySchema } from "@/utils/validators/data-management";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const parsed = trashListQuerySchema.safeParse({
    resource: searchParams.get("resource"),
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await dataManagementService.listTrash(parsed.data.resource, {
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load trash";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
