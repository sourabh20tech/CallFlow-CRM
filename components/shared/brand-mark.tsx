"use client";

import { Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  iconClassName?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandMarkProps["size"]>, string> = {
  sm: "h-10 w-10 rounded-xl",
  md: "h-12 w-12 rounded-2xl",
  lg: "h-14 w-14 rounded-2xl",
};

const ICON_CLASSES: Record<NonNullable<BrandMarkProps["size"]>, string> = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
};

const INNER_ROUNDED_CLASSES: Record<NonNullable<BrandMarkProps["size"]>, string> = {
  sm: "rounded-[0.7rem]",
  md: "rounded-[0.95rem]",
  lg: "rounded-[1.05rem]",
};

export function BrandMark({ size = "md", className, iconClassName }: BrandMarkProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 shadow-[var(--ds-shadow-glow)] ring-1 ring-white/30 transition-transform duration-[var(--ds-duration-base)]",
        SIZE_CLASSES[size],
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-[1px] border border-white/20",
          INNER_ROUNDED_CLASSES[size],
        )}
        aria-hidden
      />
      <Headphones
        className={cn(
          "relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
          ICON_CLASSES[size],
          iconClassName,
        )}
      />
    </div>
  );
}
