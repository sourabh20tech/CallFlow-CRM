import "server-only";

import { requireSupabaseConfigured } from "@/lib/supabase/config";
import { dataManagementDbService } from "@/services/db/data-management.service";
import type {
  DataManagementActionResult,
  DataManagementResource,
  TrashEntity,
  TrashItem,
} from "@/types/data-management";
import type { PaginatedResult, PaginationParams } from "@/lib/db/pagination";
import type { DataManagementActionInput } from "@/utils/validators/data-management";

export class DataManagementService {
  async executeAction(input: DataManagementActionInput): Promise<DataManagementActionResult> {
    requireSupabaseConfigured("data management actions");

    switch (input.action) {
      case "delete":
        if (input.resource === "leads") return dataManagementDbService.deleteLead(input.id);
        if (input.resource === "call_logs") return dataManagementDbService.deleteCallLog(input.id);
        return dataManagementDbService.deleteFollowUp(input.id);
      case "bulk_delete":
        return dataManagementDbService.bulkDeleteLeads(input.ids);
      case "restore":
        if (input.resource === "leads") {
          return dataManagementDbService.restoreLead(input.id);
        }
        if (input.resource === "trash") {
          return dataManagementDbService.restoreEntity(input.entity, input.id);
        }
        return { success: false, affectedCount: 0, message: "Invalid restore target" };
      case "delete_old":
        return dataManagementDbService.deleteOldCallLogs(input.olderThanDays);
      case "bulk_cleanup":
        return dataManagementDbService.bulkCleanupCallLogs(input.olderThanDays);
      case "delete_completed":
        return dataManagementDbService.deleteCompletedFollowUps();
      case "deactivate":
        return dataManagementDbService.deactivateAgent(input.id);
      case "soft_delete":
        return dataManagementDbService.softDeleteAgent(input.id);
      case "permanent_delete":
        return dataManagementDbService.permanentDelete(input.entity, input.id);
      default:
        return { success: false, affectedCount: 0, message: "Unknown action" };
    }
  }

  async listTrash(
    resource: DataManagementResource,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<TrashItem>> {
    requireSupabaseConfigured("trash listing");
    return dataManagementDbService.listTrash(resource, pagination);
  }

  async restoreFromTrash(entity: TrashEntity, id: string): Promise<DataManagementActionResult> {
    requireSupabaseConfigured("trash restore");
    return dataManagementDbService.restoreEntity(entity, id);
  }
}

export const dataManagementService = new DataManagementService();
