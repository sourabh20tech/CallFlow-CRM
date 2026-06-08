import * as React from "react";
import { cn } from "@/lib/utils";

const inputBase = cn(
  "flex w-full rounded-[var(--radius)] border border-[hsl(var(--ds-glass-border))]",
  "bg-[hsl(var(--ds-glass-bg))] px-3 py-2 text-sm leading-normal",
  "text-foreground shadow-[var(--ds-shadow-sm)]",
  "placeholder:text-muted-foreground/70 placeholder:text-sm",
  "transition-[border-color,box-shadow] duration-[var(--ds-duration-base)] ease-[var(--ds-ease)]",
  "hover:border-[hsl(var(--primary)/0.35)] hover:shadow-[var(--ds-shadow-md)]",
  "focus-visible:outline-none focus-visible:border-[hsl(var(--primary)/0.5)]",
  "focus-visible:shadow-[var(--ds-shadow-md),0_0_0_3px_hsl(var(--ring)/0.15)]",
  "disabled:cursor-not-allowed disabled:opacity-55",
);

const FormInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input type={type} ref={ref} className={cn(inputBase, "h-10", className)} {...props} />
  ),
);
FormInput.displayName = "FormInput";

const FormTextarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(inputBase, "min-h-[100px] resize-y py-2.5", className)}
      {...props}
    />
  ),
);
FormTextarea.displayName = "FormTextarea";

export { FormInput, FormTextarea };
