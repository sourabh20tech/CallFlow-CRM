import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CrmAccessGuard } from "@/components/auth/crm-access-guard";
import { DashboardShell } from "@/components/layouts/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <Suspense>
        <AuthGuard>
          <CrmAccessGuard>{children}</CrmAccessGuard>
        </AuthGuard>
      </Suspense>
    </DashboardShell>
  );
}
