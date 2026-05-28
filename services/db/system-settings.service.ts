import { BaseDbService } from "@/services/db/base.service";
import {
  handleQueryOrThrow,
  requireCurrentUserId,
  stripUndefined,
} from "@/lib/db/api-helpers";
import { DbError, toDbError } from "@/lib/db/errors";
import { SYSTEM_SETTINGS_KEY } from "@/lib/system/constants";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  DEFAULT_MAINTENANCE_TITLE,
  mapSystemSettingsToStatus,
} from "@/lib/system/status-defaults";
import type { AdminAnnouncement, SystemStatus, UpdateCrmStatusInput } from "@/types/system";
import type { Database, SystemSettingsRow } from "@/types/database";
import type { TypedSupabaseClient } from "@/lib/supabase/typed-client";

export class SystemSettingsDbService extends BaseDbService {
  private mapSystemSettingsToAnnouncement(
    row: Partial<SystemSettingsRow> | null | undefined,
  ): AdminAnnouncement {
    return {
      title: row?.admin_announcement_title?.trim() ?? "",
      message: row?.admin_announcement_message?.trim() ?? "",
      updatedAt: row?.updated_at ?? null,
    };
  }

  private typeSafePatch(
    patch: Database["public"]["Tables"]["system_settings"]["Update"],
  ): Database["public"]["Tables"]["system_settings"]["Update"] {
    return patch;
  }

  private isMissingColumnError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return message.includes("column") && message.includes("does not exist");
  }

  private async resolveSettingsRow(
    supabase: TypedSupabaseClient,
  ): Promise<Pick<SystemSettingsRow, "id"> | null> {
    // Primary path: key-based singleton lookup (works for UUID id columns).
    try {
      const byKey = await handleQueryOrThrow(
        supabase
          .from("system_settings")
          .select("id")
          .eq("setting_key", SYSTEM_SETTINGS_KEY)
          .limit(1)
          .maybeSingle(),
      );
      if (byKey?.id) return { id: byKey.id };
    } catch {
      // Fallback when setting_key does not exist yet.
    }

    const first = await handleQueryOrThrow(
      supabase
        .from("system_settings")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    );
    return first?.id ? { id: first.id } : null;
  }

  private async getOrCreateSettingsRow(supabase: TypedSupabaseClient) {
    const existing = await this.resolveSettingsRow(supabase);
    if (existing?.id) {
      const data = await handleQueryOrThrow(
        supabase.from("system_settings").select("*").eq("id", existing.id).maybeSingle(),
      );
      if (data) return data;
    }

    // Never force string IDs into potential UUID columns.
    try {
      const inserted = await handleQueryOrThrow(
        supabase
          .from("system_settings")
          .insert({
            setting_key: SYSTEM_SETTINGS_KEY,
            crm_enabled: true,
            maintenance_mode: false,
            maintenance_title: DEFAULT_MAINTENANCE_TITLE,
            maintenance_message: DEFAULT_MAINTENANCE_MESSAGE,
          })
          .select("*")
          .maybeSingle(),
      );
      return inserted;
    } catch (error) {
      if (!this.isMissingColumnError(error)) throw error;
      const inserted = await handleQueryOrThrow(
        supabase
          .from("system_settings")
          .insert({
            crm_enabled: true,
            maintenance_mode: false,
            maintenance_title: DEFAULT_MAINTENANCE_TITLE,
            maintenance_message: DEFAULT_MAINTENANCE_MESSAGE,
          })
          .select("*")
          .maybeSingle(),
      );
      return inserted;
    }
  }

  async getStatus(client?: TypedSupabaseClient): Promise<SystemStatus> {
    const supabase = await this.db(client);
    try {
      const data = await this.getOrCreateSettingsRow(supabase);
      return mapSystemSettingsToStatus(data as Partial<SystemSettingsRow> | null);
    } catch (error) {
      if (!this.isMissingColumnError(error)) {
        throw toDbError(error, "Failed to load system settings");
      }
      const fallback = await handleQueryOrThrow(
        supabase
          .from("system_settings")
          .select("id, updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      );
      return mapSystemSettingsToStatus(fallback as Partial<SystemSettingsRow> | null);
    }
  }

  async setCrmEnabled(
    input: UpdateCrmStatusInput,
    client?: TypedSupabaseClient,
  ): Promise<SystemStatus> {
    const supabase = await this.db(client);
    const userId = await requireCurrentUserId(supabase);
    const payload = stripUndefined({
      crm_enabled: input.crmEnabled,
      maintenance_mode: !input.crmEnabled,
      maintenance_title: input.maintenanceTitle,
      maintenance_message: input.maintenanceMessage,
      updated_by: userId,
    });

    const payloadVariants = [
      this.typeSafePatch(payload),
      this.typeSafePatch(
        stripUndefined({
          crm_enabled: input.crmEnabled,
          maintenance_mode: !input.crmEnabled,
          maintenance_title: input.maintenanceTitle,
          maintenance_message: input.maintenanceMessage,
        }),
      ),
      this.typeSafePatch(
        stripUndefined({
          crm_enabled: input.crmEnabled,
          maintenance_title: input.maintenanceTitle,
          maintenance_message: input.maintenanceMessage,
        }),
      ),
      this.typeSafePatch(
        stripUndefined({
          maintenance_mode: !input.crmEnabled,
          maintenance_title: input.maintenanceTitle,
          maintenance_message: input.maintenanceMessage,
        }),
      ),
      this.typeSafePatch(
        stripUndefined({
          crm_enabled: input.crmEnabled,
        }),
      ),
    ];

    const targetRow = await this.resolveSettingsRow(supabase);
    if (!targetRow?.id) {
      await this.getOrCreateSettingsRow(supabase);
    }
    const resolved = await this.resolveSettingsRow(supabase);
    if (!resolved?.id) {
      throw new DbError("System settings row is missing", "NOT_FOUND");
    }

    for (const variant of payloadVariants) {
      try {
        const data = await handleQueryOrThrow(
          supabase
            .from("system_settings")
            .update(variant)
            .eq("id", resolved.id)
            .select("*")
            .maybeSingle(),
        );

        if (data) {
          return mapSystemSettingsToStatus(data as Partial<SystemSettingsRow>);
        }
      } catch (error) {
        if (this.isMissingColumnError(error)) {
          continue;
        }
        throw toDbError(error, "Failed to update system settings");
      }
    }

    const upserted = await handleQueryOrThrow(
      supabase
        .from("system_settings")
        .update({
          crm_enabled: input.crmEnabled,
          maintenance_mode: !input.crmEnabled,
          maintenance_title: input.maintenanceTitle ?? DEFAULT_MAINTENANCE_TITLE,
          maintenance_message: input.maintenanceMessage ?? DEFAULT_MAINTENANCE_MESSAGE,
          updated_by: userId,
        })
        .eq("id", resolved.id)
        .select("*")
        .maybeSingle(),
    );

    return mapSystemSettingsToStatus(upserted as Partial<SystemSettingsRow> | null);
  }

  async getAnnouncement(client?: TypedSupabaseClient): Promise<AdminAnnouncement> {
    const supabase = await this.db(client);
    try {
      const data = await this.getOrCreateSettingsRow(supabase);
      return this.mapSystemSettingsToAnnouncement(data as Partial<SystemSettingsRow> | null);
    } catch (error) {
      if (!this.isMissingColumnError(error)) {
        throw toDbError(error, "Failed to load admin announcement");
      }
      return { title: "", message: "", updatedAt: null };
    }
  }

  async setAnnouncement(
    input: { title: string; message: string },
    client?: TypedSupabaseClient,
  ): Promise<AdminAnnouncement> {
    const supabase = await this.db(client);
    const userId = await requireCurrentUserId(supabase);

    const targetRow = await this.resolveSettingsRow(supabase);
    if (!targetRow?.id) {
      await this.getOrCreateSettingsRow(supabase);
    }
    const resolved = await this.resolveSettingsRow(supabase);
    if (!resolved?.id) {
      throw new DbError("System settings row is missing", "NOT_FOUND");
    }

    const payload = stripUndefined({
      admin_announcement_title: input.title,
      admin_announcement_message: input.message,
      updated_by: userId,
    });
    const fallbackPayload = stripUndefined({
      admin_announcement_title: input.title,
      admin_announcement_message: input.message,
    });

    try {
      const data = await handleQueryOrThrow(
        supabase
          .from("system_settings")
          .update(this.typeSafePatch(payload))
          .eq("id", resolved.id)
          .select("*")
          .maybeSingle(),
      );
      return this.mapSystemSettingsToAnnouncement(data as Partial<SystemSettingsRow> | null);
    } catch (error) {
      if (!this.isMissingColumnError(error)) {
        throw toDbError(error, "Failed to update admin announcement");
      }
      const data = await handleQueryOrThrow(
        supabase
          .from("system_settings")
          .update(this.typeSafePatch(fallbackPayload))
          .eq("id", resolved.id)
          .select("*")
          .maybeSingle(),
      );
      return this.mapSystemSettingsToAnnouncement(data as Partial<SystemSettingsRow> | null);
    }
  }
}

export const systemSettingsDbService = new SystemSettingsDbService("browser");
export const systemSettingsDbServiceServer = new SystemSettingsDbService("server");
