import { pageSection } from "@/lib/design-system/styles";
import { SkeletonChart, SkeletonPageHeader, SkeletonStatCard } from "@/components/design-system/skeletons";

export function ReportsDashboardSkeleton() {
  return (
    <div className={pageSection}>
      <SkeletonPageHeader />
      <div className="h-20 rounded-2xl border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/40" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <SkeletonChart />
      <div className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  );
}
