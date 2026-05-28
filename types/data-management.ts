export const DATA_MANAGEMENT_RESOURCES = [
  "leads",
  "call_logs",
  "follow_ups",
  "agents",
] as const;

export type DataManagementResource = (typeof DATA_MANAGEMENT_RESOURCES)[number];

export type TrashEntity = DataManagementResource;

export interface TrashItem {
  id: string;
  resource: TrashEntity;
  label: string;
  deletedAt: string;
  meta?: string;
}

export interface DataManagementActionResult {
  success: boolean;
  affectedCount: number;
  message?: string;
}
