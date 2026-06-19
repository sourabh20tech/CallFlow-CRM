import { BaseDbService } from "@/services/db/base.service";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";
import type { LeadStatusConfig, CreateLeadStatusInput, UpdateLeadStatusInput } from "@/types/lead-status-config";

interface StatusRow {
  id: string;
  label: string;
  value: string;
  color: string;
  sort_order: number;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: StatusRow): LeadStatusConfig {
  return {
    id: row.id,
    label: row.label,
    value: row.value,
    color: row.color,
    sortOrder: row.sort_order,
    isSystem: row.is_system,
    createdAt: row.created_at,
  };
}

function toValue(label: string): string {
  return label.trim().toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export class LeadStatusesDbService extends BaseDbService {
  async list(client?: TypedSupabaseClient): Promise<LeadStatusConfig[]> {
    const supabase = await this.db(client);

    const { data, error } = await (supabase as any)
      .from("lead_statuses")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      // Table might not exist yet — return defaults
      return this.getDefaults();
    }

    const rows = (data ?? []) as StatusRow[];
    return rows.length > 0 ? rows.map(mapRow) : this.getDefaults();
  }

  async create(
    input: CreateLeadStatusInput,
    userId: string,
    client?: TypedSupabaseClient,
  ): Promise<LeadStatusConfig> {
    const supabase = await this.db(client);
    const value = toValue(input.label);

    if (!input.label.trim()) throw new Error("Label is required");
    if (!value) throw new Error("Invalid label — cannot generate value");

    // Get next sort order
    const { data: maxRow } = await (supabase as any)
      .from("lead_statuses")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = ((maxRow as StatusRow | null)?.sort_order ?? 6) + 1;

    const { data, error } = await (supabase as any)
      .from("lead_statuses")
      .insert({
        label: input.label.trim(),
        value,
        color: input.color || "#8b5cf6",
        sort_order: nextOrder,
        is_system: false,
        created_by: userId,
      })
      .select("*")
      .single();

    if (error) {
      if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
        throw new Error(`Status "${input.label}" already exists`);
      }
      throw new Error(error.message);
    }

    return mapRow(data as StatusRow);
  }

  async update(
    id: string,
    input: UpdateLeadStatusInput,
    client?: TypedSupabaseClient,
  ): Promise<LeadStatusConfig> {
    const supabase = await this.db(client);

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.label !== undefined) {
      patch.label = input.label.trim();
      patch.value = toValue(input.label);
    }
    if (input.color !== undefined) patch.color = input.color;
    if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

    const { data, error } = await (supabase as any)
      .from("lead_statuses")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return mapRow(data as StatusRow);
  }

  async delete(id: string, client?: TypedSupabaseClient): Promise<void> {
    const supabase = await this.db(client);

    // Prevent deleting system statuses
    const { data: row } = await (supabase as any)
      .from("lead_statuses")
      .select("is_system")
      .eq("id", id)
      .maybeSingle();

    if ((row as StatusRow | null)?.is_system) {
      throw new Error("Cannot delete system status");
    }

    const { error } = await (supabase as any)
      .from("lead_statuses")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  private getDefaults(): LeadStatusConfig[] {
    return [
      { id: "sys-new", label: "New", value: "new", color: "#3b82f6", sortOrder: 1, isSystem: true, createdAt: "" },
      { id: "sys-interested", label: "Interested", value: "interested", color: "#8b5cf6", sortOrder: 2, isSystem: true, createdAt: "" },
      { id: "sys-follow_up", label: "Follow-Up", value: "follow_up", color: "#f59e0b", sortOrder: 3, isSystem: true, createdAt: "" },
      { id: "sys-converted", label: "Converted", value: "converted", color: "#10b981", sortOrder: 4, isSystem: true, createdAt: "" },
      { id: "sys-not_interested", label: "Not Interested", value: "not_interested", color: "#ef4444", sortOrder: 5, isSystem: true, createdAt: "" },
      { id: "sys-closed", label: "Closed", value: "closed", color: "#6b7280", sortOrder: 6, isSystem: true, createdAt: "" },
    ];
  }
}

export const leadStatusesDbService = new LeadStatusesDbService("browser");
export const leadStatusesDbServiceServer = new LeadStatusesDbService("server");
