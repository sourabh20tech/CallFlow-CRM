export {
  defaultDashboardPathForRole,
  resolvePostLoginPath,
} from "@/lib/auth/post-login-path";

export {
  ADMIN_ONLY_ROUTES,
  AUTH_ROUTES,
  PROTECTED_PREFIX,
  isAuthRoute,
  isProtectedRoute,
  isAdminOnlyRoute,
  canAccessRoute,
  isAdminRole,
  roleLabel,
} from "@/lib/auth/roles";

export {
  fetchProfile,
  resolveUserFromAuth,
  profileToUser,
  metadataToUser,
  resolveCrmRole,
  normalizeCrmRole,
} from "@/lib/auth/profile";

export { provisionProfileForAuthUser, provisionCrmUser } from "@/lib/auth/provision-profile";
export { ensureProfileViaRpc } from "@/lib/auth/ensure-profile-rpc";
export { resolveSessionUser } from "@/lib/auth/resolve-session-user";
export { resolveAuthenticatedUserRole } from "@/lib/auth/resolve-user-role";

export { getServerUser, requireServerUser } from "@/lib/auth/session.server";
export { requireAuth, requireRole, requireAdmin } from "@/lib/auth/guards";
export {
  assertAgentCanAuthenticate,
  fetchAgentAccountStatus,
  INACTIVE_AGENT_LOGIN_MESSAGE,
} from "@/lib/auth/agent-account";
export { formatAuthError } from "@/lib/auth/errors";
export { loginSchema, userRoleSchema, emailSchema, type LoginFormValues } from "@/lib/auth/schemas";
