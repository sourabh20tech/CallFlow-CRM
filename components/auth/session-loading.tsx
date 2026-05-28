import { SkeletonPageHeader, SkeletonStatCard } from "@/components/design-system/skeletons";
import { cn } from "@/lib/utils";

interface SessionLoadingProps {
  className?: string;
  variant?: "dashboard" | "minimal";
}

export function SessionLoading({ className, variant = "dashboard" }: SessionLoadingProps) {
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground",
          className,
        )}
      >
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Verifying session…
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-[var(--ds-section-gap)]", className)}>
      <SkeletonPageHeader />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
    </div>
  );
}
