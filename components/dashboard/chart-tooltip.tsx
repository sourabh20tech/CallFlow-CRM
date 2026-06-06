"use client";

interface ChartTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number | string; color: string }[];
  label?: string | number;
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-popover/95 px-3 py-2 shadow-lg ">
      {label != null && label !== "" && (
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{String(label)}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="capitalize text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold">
              {typeof entry.value === "number" ? entry.value.toLocaleString("en-IN") : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
