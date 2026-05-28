import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/design-system/glass-card";
import { cardHeader } from "@/lib/design-system/styles";

interface DataTableCardProps {
  title?: string;
  description?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DataTableCard({
  title,
  description,
  toolbar,
  children,
  className,
}: DataTableCardProps) {
  return (
    <GlassCard variant="default" padding="none" className={cn("overflow-hidden", className)}>
      {(title || toolbar) && (
        <div className={cn(cardHeader, !title && "sm:justify-end")}>
          <div className="min-w-0">
            {title && <h3 className="ds-h3">{title}</h3>}
            {description && <p className="ds-caption mt-0.5 text-pretty">{description}</p>}
          </div>
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}
      <div className="overflow-x-auto p-2 scrollbar-thin sm:p-3">{children}</div>
    </GlassCard>
  );
}
