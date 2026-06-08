import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-[var(--radius)] border border-[hsl(var(--ds-glass-border))]",
        "bg-[hsl(var(--ds-glass-bg))] px-3 py-2 text-sm leading-normal",
        "text-foreground shadow-[var(--ds-shadow-sm)]",
        "placeholder:text-muted-foreground/70 placeholder:text-sm",
        "transition-[border-color,box-shadow] duration-[var(--ds-duration-base)] ease-[var(--ds-ease)]",
        "hover:border-[hsl(var(--primary)/0.35)] hover:shadow-[var(--ds-shadow-md)]",
        "focus-visible:outline-none focus-visible:border-[hsl(var(--primary)/0.5)]",
        "focus-visible:shadow-[var(--ds-shadow-md),0_0_0_3px_hsl(var(--ring)/0.15)]",
        "disabled:cursor-not-allowed disabled:opacity-55",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
