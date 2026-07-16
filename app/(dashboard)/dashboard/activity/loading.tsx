import { SkeletonPageHeader, SkeletonTable } from "@/components/design-system/skeletons";

export default function ActivityLoading() {
  return (
    <div className="flex flex-col gap-[var(--ds-section-gap)]">
      <SkeletonPageHeader />
      <SkeletonTable rows={8} cols={4} />
    </div>
  );
}
