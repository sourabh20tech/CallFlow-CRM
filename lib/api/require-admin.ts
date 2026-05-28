import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/session.server";
import type { User } from "@/types/auth";

type AdminResult =
  | { user: User; error?: never }
  | { user?: never; error: NextResponse };

export async function requireAdminApi(): Promise<AdminResult> {
  const user = await getServerUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}
