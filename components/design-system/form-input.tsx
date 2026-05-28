import * as React from "react";
import { cn } from "@/lib/utils";
import { formControl } from "@/lib/design-system/styles";

const FormInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input type={type} ref={ref} className={cn(formControl, "h-11", className)} {...props} />
  ),
);
FormInput.displayName = "FormInput";

const FormTextarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(formControl, "min-h-[100px] resize-y py-2.5", className)}
      {...props}
    />
  ),
);
FormTextarea.displayName = "FormTextarea";

export { FormInput, FormTextarea };
