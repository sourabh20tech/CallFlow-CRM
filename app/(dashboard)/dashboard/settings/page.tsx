import { PageHeader } from "@/components/design-system/page-header";
import { SettingsContent } from "@/components/settings/settings-content";
import { pageSection } from "@/lib/design-system/styles";

export const metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className={pageSection}>
      <PageHeader
        title="Settings"
        description="Workspace configuration, system control, and integrations (admin only)"
      />
      <SettingsContent />
    </div>
  );
}
