"use client";

import { LatestLeadsTable } from "@/components/dashboard/latest-leads-table";
import type { DashboardLeadRow } from "@/types/dashboard";

interface AdminLatestLeadsSectionProps {
  leads: DashboardLeadRow[];
}

export function AdminLatestLeadsSection({ leads }: AdminLatestLeadsSectionProps) {
  return (
    <section aria-label="Latest leads" className="reports-chart-animate" style={{ animationDelay: "360ms" }}>
      <LatestLeadsTable leads={leads} />
    </section>
  );
}
