import { Skeleton } from "@/components/ui/skeleton";
import { pageSection } from "@/lib/design-system/styles";

export function AgentPanelSkeleton() {
  return (
    <div className={pageSection}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-[var(--ds-stack-gap)] sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="grid gap-[var(--ds-stack-gap)] lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
