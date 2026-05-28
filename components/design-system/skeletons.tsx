import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/design-system/glass-card";

function SkeletonBase({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("ds-skeleton-shimmer rounded-lg", className)}
      aria-hidden
      {...props}
    />
  );
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <GlassCard padding="md" className={className}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <SkeletonBase className="h-3 w-20" />
          <SkeletonBase className="h-8 w-28" />
          <SkeletonBase className="h-3 w-32" />
        </div>
        <SkeletonBase className="h-11 w-11 rounded-xl" />
      </div>
    </GlassCard>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <GlassCard padding="none">
      <div className="space-y-3 border-b border-border/50 p-6">
        <SkeletonBase className="h-6 w-40" />
        <SkeletonBase className="h-10 w-full max-w-sm" />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex gap-4 px-2">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonBase key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex gap-4 rounded-lg px-2 py-3">
            {Array.from({ length: cols }).map((_, col) => (
              <SkeletonBase key={col} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <GlassCard padding="md" className={className}>
      <SkeletonBase className="mb-4 h-5 w-36" />
      <SkeletonBase className="h-[280px] w-full rounded-xl" />
    </GlassCard>
  );
}

export function SkeletonPageHeader() {
  return (
    <div className="space-y-2">
      <SkeletonBase className="h-9 w-48" />
      <SkeletonBase className="h-4 w-72 max-w-full" />
    </div>
  );
}

export { SkeletonBase as Skeleton };
