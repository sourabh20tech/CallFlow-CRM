"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-auto min-h-10 w-full flex-wrap items-center justify-start gap-1 rounded-xl",
      "border border-[hsl(var(--ds-glass-border))] bg-[hsl(var(--ds-glass-bg))] p-1",
      "text-muted-foreground shadow-[var(--ds-shadow-sm)]",
      "sm:w-auto sm:flex-nowrap",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium sm:text-sm",
      "ring-offset-background transition-all duration-[var(--ds-duration-base)] ease-[var(--ds-ease-out)]",
      "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:border data-[state=active]:border-[hsl(var(--sidebar-active-border))]",
      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/18 data-[state=active]:to-indigo-500/10",
      "data-[state=active]:text-foreground data-[state=active]:shadow-[var(--ds-shadow-sm)]",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "ds-animate-in",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
