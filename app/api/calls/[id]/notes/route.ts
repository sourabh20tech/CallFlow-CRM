import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/api/require-auth";
import { callsService } from "@/services/calls.service";
import { callNoteSchema } from "@/utils/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;
  const notes = await callsService.getNotes(id);
  return NextResponse.json(notes);
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAuthApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = callNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const call = await callsService.getById(id);
    const note = await callsService.addNote(id, parsed.data.content, call?.leadId);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add note";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
