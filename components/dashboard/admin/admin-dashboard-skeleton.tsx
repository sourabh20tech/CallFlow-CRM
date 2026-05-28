import { pageSection } from "@/lib/design-system/styles";
import {
  SkeletonChart,
  SkeletonPageHeader,
  SkeletonStatCard,
  SkeletonTable,
} from "@/components/design-system/skeletons";

export function AdminDashboardSkeleton() {
  return (
    <div className={pageSection}>
      <SkeletonPageHeader />
      <div className="grid gap-[var(--ds-stack-gap)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <SkeletonChart />
      <SkeletonTable />
    </div>
  );
}
