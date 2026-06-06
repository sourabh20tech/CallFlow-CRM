import { SkeletonPageHeader, SkeletonStatCard, SkeletonTable } from "@/components/design-system/skeletons";
import { pageSection } from "@/lib/design-system/styles";

export default function CallsLoading() {
  return (
    <div className={pageSection}>
      <SkeletonPageHeader />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
