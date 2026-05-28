import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("ds-skeleton-shimmer rounded-lg", className)}
      aria-hidden
      {...props}
    />
  );
}

export { Skeleton };
