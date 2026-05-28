import { Suspense } from "react";
import { PageHeader } from "@/components/design-system/page-header";
import { SettingsContent } from "@/components/settings/settings-content";
import { pageSection } from "@/lib/design-system/styles";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <div className={pageSection}>
      <PageHeader
        title="Settings"
        description="Workspace configuration, system control, and integrations (admin only)"
      />

      <Suspense fallback={null}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
