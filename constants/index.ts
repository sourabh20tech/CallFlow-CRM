export { APP_NAME, APP_DESCRIPTION } from "@/constants/app";
export {
  NAV_ITEMS,
  getNavItemsForRole,
  getBreadcrumbs,
  isNavItemActive,
  NAV_ICONS,
  type NavItem,
  type NavIconKey,
} from "@/constants/navigation";

/** @deprecated Use lib/auth/roles.ts for route guards */
export const AUTH_ROUTES = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
} as const;

export const PROTECTED_PREFIX = "/dashboard";
