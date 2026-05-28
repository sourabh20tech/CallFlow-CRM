/**
 * CallFlow CRM — Design System Tokens
 * Use CSS variables in globals.css for runtime theming; these are for TS/docs.
 */

export const colors = {
  brand: {
    primary: "hsl(262 83% 58%)",
    primaryDark: "hsl(262 83% 65%)",
    secondary: "hsl(221 83% 53%)",
    accent: "hsl(280 70% 60%)",
  },
  semantic: {
    success: "hsl(142 71% 45%)",
    warning: "hsl(38 92% 50%)",
    error: "hsl(0 84% 60%)",
    info: "hsl(221 83% 53%)",
  },
  sidebar: {
    light: {
      bg: "hsl(0 0% 100% / 0.55)",
      border: "hsl(0 0% 100% / 0.25)",
      active: "hsl(262 83% 58% / 0.12)",
    },
    dark: {
      bg: "hsl(240 12% 10% / 0.65)",
      border: "hsl(240 8% 22% / 0.6)",
      active: "hsl(262 83% 65% / 0.18)",
    },
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "var(--font-geist-sans), system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
  },
  scale: {
    display: { size: "2.25rem", lineHeight: "2.5rem", weight: 700 },
    h1: { size: "1.875rem", lineHeight: "2.25rem", weight: 700 },
    h2: { size: "1.5rem", lineHeight: "2rem", weight: 600 },
    h3: { size: "1.25rem", lineHeight: "1.75rem", weight: 600 },
    body: { size: "0.875rem", lineHeight: "1.25rem", weight: 400 },
    caption: { size: "0.75rem", lineHeight: "1rem", weight: 500 },
    overline: { size: "0.6875rem", lineHeight: "1rem", weight: 600 },
  },
} as const;

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  section: "var(--ds-section-gap)",
  card: "var(--ds-card-padding)",
  stack: "var(--ds-stack-gap)",
} as const;

export const radii = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "1rem",
  full: "9999px",
} as const;

export const shadows = {
  sm: "var(--ds-shadow-sm)",
  md: "var(--ds-shadow-md)",
  lg: "var(--ds-shadow-lg)",
  glow: "var(--ds-shadow-glow)",
  card: "var(--ds-shadow-card)",
} as const;

export const motion = {
  fast: "150ms",
  base: "200ms",
  slow: "300ms",
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const glass = {
  blur: "16px",
  blurStrong: "24px",
  borderLight: "hsl(0 0% 100% / 0.22)",
  borderDark: "hsl(240 8% 30% / 0.5)",
} as const;

export const statusVariants = [
  "default",
  "success",
  "warning",
  "error",
  "info",
  "neutral",
] as const;

export type StatusVariant = (typeof statusVariants)[number];
