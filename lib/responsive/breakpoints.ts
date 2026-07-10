/**
 * Enterprise Responsive Breakpoints — Single source of truth.
 * Use these constants instead of hardcoding pixel values.
 */

export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
  "3xl": 1920,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Device categories for layout decisions.
 * Use in components that need radically different layouts per device.
 */
export type DeviceCategory = "mobile" | "tablet" | "desktop";

export function getDeviceCategory(width: number): DeviceCategory {
  if (width < BREAKPOINTS.md) return "mobile";
  if (width < BREAKPOINTS.lg) return "tablet";
  return "desktop";
}
