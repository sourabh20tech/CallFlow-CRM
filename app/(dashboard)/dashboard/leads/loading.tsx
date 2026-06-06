import { SkeletonPageHeader, SkeletonTable } from "@/components/design-system/skeletons";
import { pageSection } from "@/lib/design-system/styles";

export default function LeadsLoading() {
  return (
    <div className={pageSection}>
      <SkeletonPageHeader />
      <div className="h-14 rounded-2xl border border-border/30 bg-muted/20" />
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}
