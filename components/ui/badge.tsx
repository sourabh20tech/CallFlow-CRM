import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
    "transition-colors duration-[var(--ds-duration-fast)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-primary/25 bg-primary/15 text-primary shadow-[var(--ds-shadow-sm)]",
        secondary: "border-border/60 bg-secondary/80 text-secondary-foreground",
        destructive: "border-destructive/25 bg-destructive/15 text-destructive",
        outline: "border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/50 text-foreground",
        success:
          "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
        warning: "border-amber-500/30 bg-amber-500/12 text-amber-700 dark:text-amber-400",
        info: "border-blue-500/30 bg-blue-500/12 text-blue-700 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
