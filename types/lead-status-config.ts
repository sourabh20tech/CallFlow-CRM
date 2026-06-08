export interface LeadStatusConfig {
  id: string;
  label: string;
  value: string;
  color: string;
  sortOrder: number;
  isSystem: boolean;
  createdAt: string;
}

export interface CreateLeadStatusInput {
  label: string;
  color?: string;
}

export interface UpdateLeadStatusInput {
  label?: string;
  color?: string;
  sortOrder?: number;
}
