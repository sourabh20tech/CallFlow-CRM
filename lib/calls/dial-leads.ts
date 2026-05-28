import { isSupabaseConfigured } from "@/lib/supabase/config";
import { leadsDbServiceServer } from "@/services/db/leads.service";

export interface DialLead {
  id: string;
  name: string;
  phone?: string;
  company?: string;
}

const demoDialLeads: DialLead[] = [
  { id: "lead-1", name: "Sarah Johnson", phone: "+15551234567", company: "Acme Corp" },
  { id: "lead-2", name: "Michael Chen", phone: "+15552345678", company: "TechFlow" },
  { id: "lead-3", name: "Emily Davis", phone: "+15553456789" },
  { id: "lead-4", name: "Robert Wilson", phone: "+15554567890", company: "Global Systems" },
  { id: "cust-1", name: "Sarah Johnson", phone: "+15551234567", company: "Acme" },
  { id: "cust-2", name: "Michael Chen", phone: "+15552345678", company: "TechFlow" },
];

export async function getDialLeads(): Promise<DialLead[]> {
  if (isSupabaseConfigured()) {
    try {
      const result = await leadsDbServiceServer.list({}, { page: 1, pageSize: 50 });
      return result.data.map((l) => ({
        id: l.id,
        name: l.fullName,
        phone: l.phone,
        company: l.company,
      }));
    } catch {
      return demoDialLeads;
    }
  }
  return demoDialLeads;
}
