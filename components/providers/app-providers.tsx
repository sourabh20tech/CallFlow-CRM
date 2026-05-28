"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { SystemStatusProvider } from "@/contexts/system-status-context";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={["light", "dark", "midnight", "system"]}
      disableTransitionOnChange
    >
      <SystemStatusProvider>
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              className: "backdrop-blur-xl border-border/50",
            }}
          />
          </TooltipProvider>
        </AuthProvider>
      </SystemStatusProvider>
    </ThemeProvider>
  );
}
