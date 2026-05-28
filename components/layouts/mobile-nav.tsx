"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { APP_NAME } from "@/constants/app";
import { SidebarNav } from "@/components/layouts/sidebar-nav";
import { UserMenu } from "@/components/layouts/user-menu";
import { StatusChip } from "@/components/design-system/status-chip";
import { BrandMark } from "@/components/shared/brand-mark";
import { useAuth } from "@/hooks/use-auth";
import { roleLabel } from "@/lib/auth/roles";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const { role, user } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="ds-sidebar flex w-[min(100vw-2rem,18.75rem)] flex-col p-0"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>

        <div className="flex h-16 items-center border-b border-[hsl(var(--sidebar-border))] px-4">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" />
            <div className="space-y-0.5">
              <p className="text-sm font-bold tracking-tight">{APP_NAME}</p>
              <p className="text-[11px] font-medium text-muted-foreground">CRM Workspace</p>
            </div>
          </div>
        </div>

        {role && (
          <div className="px-4 py-3">
            <StatusChip
              label={roleLabel(role)}
              variant={role === "admin" ? "default" : "info"}
              showDot={false}
              className="w-full justify-center"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <SidebarNav onNavigate={() => onOpenChange(false)} />
        </div>

        <div className="border-t border-[hsl(var(--sidebar-border))] p-4">
          {user && (
            <p className="mb-3 truncate text-xs text-muted-foreground">{user.email}</p>
          )}
          <UserMenu />
        </div>
      </SheetContent>
    </Sheet>
  );
}
