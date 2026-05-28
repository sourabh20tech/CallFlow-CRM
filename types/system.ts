export interface SystemStatus {
  crmEnabled: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  updatedAt: string | null;
}

export interface UpdateCrmStatusInput {
  crmEnabled: boolean;
  maintenanceTitle?: string;
  maintenanceMessage?: string;
}

export interface AdminAnnouncement {
  title: string;
  message: string;
  updatedAt: string | null;
}
