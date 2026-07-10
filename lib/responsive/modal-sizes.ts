/**
 * Centralized Modal Size Configuration.
 * All modals across the CRM use these standardized sizes.
 */

export const MODAL_SIZES = {
  sm: "max-w-[400px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]",
  xl: "max-w-[900px]",
  full: "max-w-[96vw]",
} as const;

export type ModalSize = keyof typeof MODAL_SIZES;

/**
 * Modal responsive rules (applied via globals.css):
 * - Mobile: 96vw width, 90dvh max-height, internal scroll
 * - Tablet: 95vw, max 720px
 * - Desktop: configured size from MODAL_SIZES
 */
