import { ReportsDashboard } from "@/components/reports";
import { reportsService } from "@/services/reports.service";

export const metadata = {
  title: "Reports & Analytics",
  description: "Daily, conversion, agent, sales, and performance analytics with Excel export",
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await reportsService.getReports("7d");

  return <ReportsDashboard initialData={data} />;
}
