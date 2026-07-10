"use client";

import { cn } from "@/lib/utils";

/**
 * Enterprise Layout Containers — Centralized, reusable layout primitives.
 * Used across ALL pages for consistent spacing, max-width, and responsiveness.
 */

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

/** Page-level container with max-width and horizontal padding */
export function PageContainer({ children, className }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[var(--ds-content-max)]", className)}>
      {children}
    </div>
  );
}

/** Section spacing — consistent vertical gap between page sections */
export function PageSection({ children, className }: ContainerProps) {
  return (
    <div className={cn("flex flex-col gap-[var(--ds-section-gap)]", className)}>
      {children}
    </div>
  );
}

/** Card container with responsive padding */
export function ContentCard({ children, className }: ContainerProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--ds-radius-card)] border border-[hsl(var(--ds-glass-border))]",
        "bg-[hsl(var(--ds-glass-bg))] p-[var(--ds-card-padding)]",
        "shadow-[var(--ds-shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Responsive grid for stat cards */
export function StatsGrid({ children, className }: ContainerProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5", className)}>
      {children}
    </div>
  );
}

/** Responsive two-column layout (main + sidebar) */
export function TwoColumnLayout({
  children,
  className,
  sidebar,
}: ContainerProps & { sidebar?: React.ReactNode }) {
  return (
    <div className={cn("grid gap-[var(--ds-stack-gap)] xl:grid-cols-[1fr_300px]", className)}>
      <div className="min-w-0">{children}</div>
      {sidebar && <div className="min-w-0">{sidebar}</div>}
    </div>
  );
}
