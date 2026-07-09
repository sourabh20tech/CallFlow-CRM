export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  force: "standard" | "premium";
  lastContactAt: string;
  totalCalls: number;
}
