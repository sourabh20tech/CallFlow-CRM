"use client";

interface ChartEmptyStateProps {
  message?: string;
}

export function ChartEmptyState({
  message = "No data for this period",
}: ChartEmptyStateProps) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/80">Try a wider date range or add CRM activity</p>
    </div>
  );
}
