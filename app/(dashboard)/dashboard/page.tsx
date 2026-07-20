import { DashboardHome } from "@/components/dashboard/dashboard-home";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <DashboardHome />;
}
