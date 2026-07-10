"use client";

import { cn } from "@/lib/utils";

/**
 * Enterprise Responsive Table Wrapper.
 * - Desktop: renders the table directly
 * - Mobile: wraps in horizontal scroll container with touch support
 * 
 * Usage:
 * <ResponsiveTable>
 *   <Table>...</Table>
 * </ResponsiveTable>
 */
interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-[var(--ds-radius-card)]",
        "-webkit-overflow-scrolling-touch",
        className,
      )}
    >
      {children}
    </div>
  );
}
