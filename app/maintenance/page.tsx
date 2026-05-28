import { MaintenanceScreen } from "@/components/maintenance/maintenance-screen";

export const metadata = {
  title: "Maintenance",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return <MaintenanceScreen />;
}
