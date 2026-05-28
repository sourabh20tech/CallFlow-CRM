import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CrmAccessGuard } from "@/components/auth/crm-access-guard";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { SkeletonPageHeader, SkeletonStatCard } from "@/components/design-system/skeletons";

function DashboardLoading() {
  return (
    <div className="flex flex-col gap-[var(--ds-section-gap)]">
      <SkeletonPageHeader />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <Suspense fallback={<DashboardLoading />}>
        <AuthGuard>
          <CrmAccessGuard>{children}</CrmAccessGuard>
        </AuthGuard>
      </Suspense>
    </DashboardShell>
  );
}
