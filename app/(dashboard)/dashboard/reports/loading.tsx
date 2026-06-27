import { SkeletonPageHeader, SkeletonStatCard } from "@/components/design-system/skeletons";

export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-[var(--ds-section-gap)]">
      <SkeletonPageHeader />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="h-[300px] animate-pulse rounded-xl border border-border/40 bg-muted/20" />
    </div>
  );
}
