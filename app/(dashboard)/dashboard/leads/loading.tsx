import { SkeletonPageHeader, SkeletonStatCard, SkeletonTable } from "@/components/design-system/skeletons";

export default function LeadsLoading() {
  return (
    <div className="flex flex-col gap-[var(--ds-section-gap)]">
      <SkeletonPageHeader />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}
