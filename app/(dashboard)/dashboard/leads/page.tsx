import { LeadsManagement } from "@/components/leads";

export const metadata = {
  title: "Leads",
  description: "Manage prospects, assignments, and pipeline",
};

export default function LeadsPage() {
  return <LeadsManagement initialLeads={[]} initialAgents={[]} initialTotal={0} initialTotalPages={1} />;
}
