import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { sectionHeader } from "@/lib/design-system/styles";

interface AgentPanelSectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function AgentPanelSectionHeader({
  title,
  description,
  actions,
  className,
}: AgentPanelSectionHeaderProps) {
  return (
    <div className={cn(sectionHeader, className)}>
      <div className="min-w-0">
        <h3 className="ds-h3">{title}</h3>
        {description && <p className="ds-caption mt-0.5 text-pretty text-muted-foreground">{description}</p>}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
