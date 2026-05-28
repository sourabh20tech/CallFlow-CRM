import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassCardVariants = cva(
  "rounded-[var(--ds-radius-card)] text-card-foreground",
  {
    variants: {
      variant: {
        default: "ds-glass",
        strong: "ds-glass-strong",
        subtle:
          "border border-border/50 bg-background/45 shadow-[var(--ds-shadow-sm)] backdrop-blur-md",
        gradient: "ds-glass ds-gradient-border",
      },
      padding: {
        none: "",
        sm: "p-4 sm:p-5",
        md: "p-4 sm:p-6",
        lg: "p-5 sm:p-8",
      },
      interactive: {
        true: "ds-hover-lift cursor-pointer",
        false: "ds-hover-subtle",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      interactive: false,
    },
  },
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof glassCardVariants> {}

export function GlassCard({
  className,
  variant,
  padding,
  interactive,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(glassCardVariants({ variant, padding, interactive }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { glassCardVariants };
