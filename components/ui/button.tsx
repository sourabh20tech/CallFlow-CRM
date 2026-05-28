import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium",
    "transition-all duration-[var(--ds-duration-base)] ease-[var(--ds-ease-out)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-[var(--ds-shadow-md)] shadow-primary/20",
          "hover:bg-primary/90 hover:shadow-[var(--ds-shadow-lg)] hover:shadow-primary/25",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground shadow-[var(--ds-shadow-sm)]",
          "hover:bg-destructive/90",
        ].join(" "),
        outline: [
          "border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]/60",
          "backdrop-blur-sm shadow-[var(--ds-shadow-sm)]",
          "hover:border-primary/30 hover:bg-accent/50 hover:shadow-[var(--ds-shadow-md)]",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground shadow-[var(--ds-shadow-sm)]",
          "hover:bg-secondary/80",
        ].join(" "),
        ghost: "hover:bg-accent/70 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: [
          "border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))]",
          "text-foreground shadow-[var(--ds-shadow-card)] backdrop-blur-md",
          "hover:border-primary/25 hover:bg-[hsl(var(--ds-glass-bg-strong))] hover:shadow-[var(--ds-shadow-lg)]",
        ].join(" "),
        premium: [
          "border border-violet-500/30 bg-gradient-to-r from-violet-600 to-indigo-600 text-white",
          "shadow-[var(--ds-shadow-glow)]",
          "hover:from-violet-500 hover:to-indigo-500 hover:shadow-[var(--ds-shadow-lg)]",
        ].join(" "),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
