import { Badge } from "@/components/ui/badge";
import {
  FOLLOWUP_PRIORITY_VARIANT,
  formatFollowupPriority,
} from "@/lib/followups/constants";
import type { FollowupPriority } from "@/types/followup";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: FollowupPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const variant = FOLLOWUP_PRIORITY_VARIANT[priority];
  return (
    <Badge variant={variant} className={cn("shrink-0 uppercase tracking-wide", className)}>
      {formatFollowupPriority(priority)}
    </Badge>
  );
}
