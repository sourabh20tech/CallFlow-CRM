"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsClient } from "@/hooks/use-is-client";

const THEMES = ["light", "dark", "midnight"] as const;
type ThemeName = (typeof THEMES)[number];

function getNextTheme(currentTheme: string | undefined): ThemeName {
  const normalized = (currentTheme === "system" || !currentTheme
    ? "dark"
    : currentTheme) as ThemeName;
  const idx = THEMES.indexOf(normalized);
  if (idx === -1) return "dark";
  return THEMES[(idx + 1) % THEMES.length]!;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();
  const activeTheme = isClient
    ? ((theme === "system" ? "dark" : theme) as ThemeName | undefined)
    : "dark";
  const nextTheme = getNextTheme(activeTheme);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl transition-colors hover:bg-primary/10"
            onClick={() => setTheme(nextTheme)}
            aria-label="Toggle theme"
          >
            {isClient ? (
              <>
                <Sun
                  className={`h-5 w-5 transition-all ${
                    activeTheme === "light" ? "scale-100 rotate-0" : "scale-0 -rotate-90"
                  }`}
                />
                <Moon
                  className={`absolute h-5 w-5 transition-all ${
                    activeTheme === "dark" ? "scale-100 rotate-0" : "scale-0 rotate-90"
                  }`}
                />
                <span
                  className={`absolute h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_hsl(189_100%_60%/0.7)] transition-all ${
                    activeTheme === "midnight"
                      ? "scale-100 opacity-100"
                      : "scale-0 opacity-0"
                  }`}
                  aria-hidden
                />
              </>
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Theme: {activeTheme}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
