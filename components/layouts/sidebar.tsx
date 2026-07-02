"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants/app";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/hooks/use-auth";
import { useIsClient } from "@/hooks/use-is-client";
import { SidebarNav } from "@/components/layouts/sidebar-nav";
import { StatusChip } from "@/components/design-system/status-chip";
import { BrandMark } from "@/components/shared/brand-mark";
import { roleLabel } from "@/lib/auth/roles";

export const Sidebar = memo(function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const { role, user } = useAuth();
  const isClient = useIsClient();
  const showRole = isClient && Boolean(role);
  const showUser = isClient && Boolean(user);

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-[100dvh] shrink-0 flex-col transition-[width] duration-[var(--ds-duration-slow)] ease-[var(--ds-ease-out)] md:flex",
        collapsed ? "w-[4.75rem]" : "w-[17.5rem]",
      )}
    >
      <div className="ds-sidebar relative flex h-full flex-col overflow-hidden">

        <div
          className={cn(
            "relative z-10 flex h-[4.25rem] shrink-0 items-center border-b border-[hsl(var(--sidebar-border))] px-4",
            collapsed && "justify-center px-3",
          )}
        >
          <BrandMark
            size="sm"
            className="shrink-0"
          />
          {!collapsed && (
            <div className="ml-3 min-w-0 space-y-0.5">
              <p className="truncate text-sm font-bold tracking-tight text-[hsl(var(--sidebar-foreground))]">
                {APP_NAME}
              </p>
              <p className="truncate text-[11px] font-medium text-[hsl(var(--sidebar-muted))]">
                CRM Workspace
              </p>
            </div>
          )}
        </div>

        {showRole && !collapsed && role && (
          <div className="relative z-10 shrink-0 px-4 py-3">
            <StatusChip
              label={roleLabel(role)}
              variant={role === "admin" ? "default" : "info"}
              showDot={false}
              className="w-full justify-center"
            />
          </div>
        )}

        <div className={cn("relative z-10 flex-1 overflow-hidden px-3", collapsed && "px-2")}>
          <SidebarNav collapsed={collapsed} />
        </div>

        {showUser && !collapsed && user && (
          <div className="relative z-10 shrink-0 border-t border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] p-4">
            <p className="truncate text-xs font-medium text-[hsl(var(--sidebar-foreground))]">
              {user.fullName ?? "Signed in"}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[hsl(var(--sidebar-muted))]">{user.email}</p>
          </div>
        )}
      </div>
    </aside>
  );
});
