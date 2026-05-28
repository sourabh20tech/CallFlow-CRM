import * as React from "react";
import { cn } from "@/lib/utils";
import { formControl } from "@/lib/design-system/styles";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input type={type} ref={ref} className={cn(formControl, "h-10", className)} {...props} />
  ),
);
Input.displayName = "Input";

export { Input };
