import { cn } from "@/lib/utils";
import { pageHeader } from "@/lib/design-system/styles";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn(pageHeader, className)}>
      <div className="min-w-0 space-y-1.5">
        <h1 className="ds-h1 text-foreground">{title}</h1>
        {description && (
          <p className="ds-body max-w-2xl text-pretty text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
