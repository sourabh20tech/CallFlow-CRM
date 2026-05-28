import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthApi } from "@/lib/api/require-auth";
import { callsService } from "@/services/calls.service";

const schema = z.object({
  leadId: z.string().min(1),
});

export async function POST(request: Request) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  try {
    const call = await callsService.initiateCall(parsed.data.leadId);
    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initiate call";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
