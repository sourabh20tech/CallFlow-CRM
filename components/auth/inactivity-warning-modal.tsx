"use client";

import { useEffect, useState } from "react";
import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from "@/components/design-system/modal";

interface InactivityWarningModalProps {
  open: boolean;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export function InactivityWarningModal({
  open,
  onStayLoggedIn,
  onLogoutNow,
}: InactivityWarningModalProps) {
  const [countdown, setCountdown] = useState(60);

  // Countdown timer
  useEffect(() => {
    if (!open) {
      setCountdown(60);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  return (
    <Modal open={open} onOpenChange={() => {}}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Session Expiring
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-muted-foreground">
            You have been inactive for a while. Your session will expire in{" "}
            <span className="font-bold tabular-nums text-foreground">{countdown} seconds</span>.
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 60) * 100}%` }}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onLogoutNow} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            Logout Now
          </Button>
          <Button onClick={onStayLoggedIn}>
            Stay Logged In
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
