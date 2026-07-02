"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavItemsForRole, isNavItemActive, NAV_ICONS, type NavItem } from "@/constants/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useIsClient } from "@/hooks/use-is-client";
import {
  sidebarNavActive,
  sidebarNavInactive,
  sidebarNavItem,
} from "@/lib/design-system/styles";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

const NavLink = memo(function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = NAV_ICONS[item.icon];

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        sidebarNavItem,
        !collapsed && "hover:translate-x-0.5",
        active ? sidebarNavActive : sidebarNavInactive,
        collapsed && "justify-center px-2.5 hover:translate-x-0",
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-500 to-indigo-500 shadow-[0_0_12px_hsl(262_83%_58%_/_0.45)]"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-all duration-[var(--ds-duration-base)]",
          active
            ? "text-primary"
            : "text-[hsl(var(--sidebar-muted))] group-hover:text-primary group-hover:scale-105",
        )}
      />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
});

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { role } = useAuth();
  const isClient = useIsClient();
  const navItems = getNavItemsForRole(isClient ? role : null);

  return (
    <TooltipProvider>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-2 scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isNavItemActive(pathname, item.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </TooltipProvider>
  );
}
