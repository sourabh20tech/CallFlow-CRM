"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeft, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from "@/components/layouts/breadcrumbs";
import { NotificationsMenu } from "@/components/layouts/notifications-menu";
import { UserMenu } from "@/components/layouts/user-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

interface TopNavbarProps {
  onMobileMenuOpen?: () => void;
}

export function TopNavbar({ onMobileMenuOpen }: TopNavbarProps) {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const router = useRouter();
  const [globalSearch, setGlobalSearch] = useState("");

  const handleGlobalSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = globalSearch.trim();
      if (!q) return;
      router.push(`/dashboard/leads?search=${encodeURIComponent(q)}`);
      setGlobalSearch("");
    },
    [globalSearch, router],
  );

  return (
    <header className={cn("ds-topbar sticky top-0 z-40 w-full")}>
      <div className="mx-auto flex h-[4.25rem] max-w-[var(--ds-content-max)] items-center gap-2 px-[var(--ds-page-padding-x)] sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-xl md:hidden"
          onClick={onMobileMenuOpen}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden shrink-0 rounded-xl md:flex"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>

        <div className="hidden min-w-0 flex-1 md:block">
          <Breadcrumbs />
        </div>

        <div className="min-w-0 flex-1 md:hidden">
          <Breadcrumbs />
        </div>

        <form
          onSubmit={handleGlobalSearch}
          className="relative hidden min-w-0 flex-1 lg:block xl:max-w-md"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads, calls, agents..."
            className="h-10 pl-9 pr-8"
            aria-label="Global search"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => setGlobalSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <NotificationsMenu />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
