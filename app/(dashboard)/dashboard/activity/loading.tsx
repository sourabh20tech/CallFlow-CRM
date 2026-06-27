import { SkeletonPageHeader, SkeletonStatCard } from "@/components/design-system/skeletons";

export default function ActivityLoading() {
  return (
    <div className="flex flex-col gap-[var(--ds-section-gap)]">
      <SkeletonPageHeader />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
