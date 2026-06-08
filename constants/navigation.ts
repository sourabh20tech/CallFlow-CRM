import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Briefcase,
  CalendarClock,
  LayoutDashboard,
  Phone,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import type { UserRole } from "@/types/auth";
import { FOLLOWUPS_ROUTE_SEGMENT } from "@/lib/followups/constants";

export type NavIconKey =
  | "LayoutDashboard"
  | "Briefcase"
  | "UserPlus"
  | "Users"
  | "Phone"
  | "CalendarClock"
  | "BarChart3"
  | "Activity"
  | "Settings";

export interface NavItem {
  title: string;
  href: string;
  icon: NavIconKey;
  roles: UserRole[] | "all";
  description?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    roles: "all",
    description: "Overview & metrics",
  },
  {
    title: "My Workspace",
    href: "/dashboard/workspace",
    icon: "Briefcase",
    roles: ["agent"],
    description: "Leads, calls & follow-ups",
  },
  {
    title: "Leads",
    href: "/dashboard/leads",
    icon: "UserPlus",
    roles: "all",
    description: "Pipeline & prospects",
  },
  {
    title: "Agents",
    href: "/dashboard/agents",
    icon: "Users",
    roles: ["admin"],
    description: "Team management",
  },
  {
    title: "Calls",
    href: "/dashboard/calls",
    icon: "Phone",
    roles: "all",
    description: "Call activity",
  },
  {
    title: "Follow-Ups",
    href: `/dashboard/${FOLLOWUPS_ROUTE_SEGMENT}`,
    icon: "CalendarClock",
    roles: "all",
    description: "Scheduled tasks",
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: "BarChart3",
    roles: "all",
    description: "Analytics",
  },
  {
    title: "Activity Logs",
    href: "/dashboard/activity",
    icon: "Activity",
    roles: "all",
    description: "Action history",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: "Settings",
    roles: ["admin"],
    description: "Workspace config",
  },
];

export const NAV_ICONS: Record<NavIconKey, LucideIcon> = {
  LayoutDashboard,
  Briefcase,
  UserPlus,
  Users,
  Phone,
  CalendarClock,
  BarChart3,
  Activity,
  Settings,
};

export function getNavItemsForRole(role: UserRole | null): NavItem[] {
  if (!role) return NAV_ITEMS.filter((item) => item.roles === "all");
  return NAV_ITEMS.filter(
    (item) => item.roles === "all" || (Array.isArray(item.roles) && item.roles.includes(role)),
  );
}

/** Breadcrumb segment labels (pathname segment → display name) */
export const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  workspace: "My Workspace",
  leads: "Leads",
  agents: "Agents",
  calls: "Calls",
  [FOLLOWUPS_ROUTE_SEGMENT]: "Follow-Ups",
  reports: "Reports",
  activity: "Activity Logs",
  settings: "Settings",
  customers: "Customers",
};

export function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  if (!pathname.startsWith("/dashboard")) {
    return [{ label: "Dashboard", href: "/dashboard" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    const label = BREADCRUMB_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, href: path });
  }

  return crumbs;
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
