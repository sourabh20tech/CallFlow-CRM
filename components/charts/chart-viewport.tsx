"use client";

import type { ReactNode } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import { cn } from "@/lib/utils";

interface ChartViewportProps {
  className?: string;
  children: ReactNode;
}

/** Defers chart layout until the client has measurable dimensions (avoids Recharts -1 warnings). */
export function ChartViewport({ className, children }: ChartViewportProps) {
  const isClient = useIsClient();

  return <div className={cn("min-h-0 min-w-0", className)}>{isClient ? children : null}</div>;
}
