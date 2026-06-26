"use client";

import { useInactivityLogout } from "@/hooks/use-inactivity-logout";
import { InactivityWarningModal } from "@/components/auth/inactivity-warning-modal";

/**
 * Monitors agent inactivity and shows warning modal.
 * Does nothing for admin users.
 * Place this inside the authenticated layout.
 */
export function AgentInactivityGuard() {
  const { showWarning, stayLoggedIn, logoutNow } = useInactivityLogout();

  return (
    <InactivityWarningModal
      open={showWarning}
      onStayLoggedIn={stayLoggedIn}
      onLogoutNow={() => void logoutNow()}
    />
  );
}
