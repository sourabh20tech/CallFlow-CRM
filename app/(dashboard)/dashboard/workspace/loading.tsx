import { SkeletonPageHeader, SkeletonStatCard, SkeletonTable } from "@/components/design-system/skeletons";

export default function WorkspaceLoading() {
  return (
    <div className="flex flex-col gap-[var(--ds-section-gap)]">
      <SkeletonPageHeader />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={5} cols={4} />
    </div>
  );
}
