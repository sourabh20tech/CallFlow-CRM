import { cn } from "@/lib/utils";

/** Glass surface — backdrop blur + transparent fill */
export const glassSurface = cn(
  "border border-[hsl(var(--ds-glass-border))]",
  "bg-[hsl(var(--ds-glass-bg))]",
  "shadow-[var(--ds-shadow-card)]",
  "backdrop-blur-[var(--ds-glass-blur)]",
);

/** Interactive lift on hover */
export const hoverLift = cn(
  "ds-hover-lift",
);

/** Focus ring for accessible controls */
export const focusRing = cn(
  "focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2",
  "focus-visible:ring-offset-[hsl(var(--background))]",
);

/** Page section vertical rhythm */
export const pageSection = cn(
  "flex flex-col gap-[var(--ds-section-gap)]",
  "ds-stagger w-full min-w-0",
);

/** Centered max-width content column */
export const pageContainer = cn("ds-page-container w-full min-w-0");

/** Card / in-card section title block */
export const cardHeader = cn("ds-card-header");

export const sectionHeader = cn("ds-section-header");

/** Page title block */
export const pageHeader = cn("ds-page-header min-w-0");

/** Staggered children animation wrapper */
export const staggerChildren = cn("ds-stagger");

/** Responsive dashboard grid */
export const dashboardGrid = cn(
  "grid gap-[var(--ds-stack-gap)]",
  "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
);

/** KPI / stat row */
export const statsGrid = cn(
  "grid gap-[var(--ds-stack-gap)]",
  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
);

/** Sidebar nav item base */
export const sidebarNavItem = cn(
  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
  "transition-all duration-[var(--ds-duration-base)] ease-[var(--ds-ease-out)]",
);

export const sidebarNavActive = cn(
  "bg-gradient-to-r from-violet-500/20 to-indigo-500/15",
  "text-[hsl(var(--sidebar-foreground))]",
  "shadow-[var(--ds-shadow-sm)]",
  "border border-[hsl(var(--sidebar-active-border))]",
);

export const sidebarNavInactive = cn(
  "border border-transparent",
  "text-[hsl(var(--sidebar-muted))]",
  "hover:border-[hsl(var(--sidebar-active-border))]/50",
  "hover:bg-[hsl(var(--sidebar-hover))]",
  "hover:text-[hsl(var(--sidebar-foreground))]",
  "hover:shadow-[var(--ds-shadow-sm)]",
);

/** Shared form control styling */
export const formControl = cn("ds-control");

/** Scrollable table wrapper */
export const tableWrap = cn("ds-table-wrap scrollbar-thin");
