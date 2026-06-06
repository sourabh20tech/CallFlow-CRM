import { SkeletonPageHeader, SkeletonStatCard } from "@/components/design-system/skeletons";
import { pageSection } from "@/lib/design-system/styles";

export default function FollowUpsLoading() {
  return (
    <div className={pageSection}>
      <SkeletonPageHeader />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-border/30 bg-muted/20" />
    </div>
  );
}
