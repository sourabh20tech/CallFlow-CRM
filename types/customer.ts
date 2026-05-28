export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  tier: "standard" | "premium" | "enterprise";
  lastContactAt: string;
  totalCalls: number;
}
