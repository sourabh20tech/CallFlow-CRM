"use client";

import { FormField } from "@/components/design-system/form-field";
import { cn } from "@/lib/utils";

interface DatetimePickerFieldProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  min?: string;
}

export function DatetimePickerField({
  id,
  label = "Due date & time",
  value,
  onChange,
  error,
  required,
  min,
}: DatetimePickerFieldProps) {
  return (
    <FormField label={label} htmlFor={id} error={error} required={required}>
      <input
        id={id}
        type="datetime-local"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background/80 px-3 py-2 text-sm",
          " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      />
    </FormField>
  );
}
