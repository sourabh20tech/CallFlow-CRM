import { SkeletonPageHeader, SkeletonTable } from "@/components/design-system/skeletons";

export default function AgentsLoading() {
  return (
    <div className="flex flex-col gap-[var(--ds-section-gap)]">
      <SkeletonPageHeader />
      <SkeletonTable rows={6} cols={6} />
    </div>
  );
}
