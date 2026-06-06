import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusChipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-[var(--ds-duration-fast)]",
  {
    variants: {
      variant: {
        default: "border-primary/25 bg-primary/10 text-primary",
        success: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
        warning: "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-400",
        error: "border-red-500/25 bg-red-500/12 text-red-700 dark:text-red-400",
        info: "border-blue-500/25 bg-blue-500/12 text-blue-700 dark:text-blue-400",
        neutral: "border-border/60 bg-muted/50 text-muted-foreground",
      },
      size: {
        sm: "px-2 py-0 text-[0.6875rem]",
        md: "px-2.5 py-0.5 text-xs",
      },
      pulse: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      pulse: false,
    },
  },
);

const dotColors: Record<NonNullable<VariantProps<typeof statusChipVariants>["variant"]>, string> = {
  default: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-muted-foreground",
};

export interface StatusChipProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusChipVariants> {
  label: string;
  showDot?: boolean;
}

export function StatusChip({
  label,
  variant = "default",
  size,
  pulse,
  showDot = true,
  className,
  ...props
}: StatusChipProps) {
  return (
    <span className={cn(statusChipVariants({ variant, size, pulse }), className)} {...props}>
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            dotColors[variant ?? "default"],
            pulse && "animate-[ds-pulse-soft_2s_ease-in-out_infinite]",
          )}
          aria-hidden
        />
      )}
      <span className="capitalize">{label}</span>
    </span>
  );
}

export { statusChipVariants };
