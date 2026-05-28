"use client";

import { useState } from "react";
import { AlertTriangle, Power, Shield } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/design-system/glass-card";
import { StatusChip } from "@/components/design-system/status-chip";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import { Button } from "@/components/ui/button";
import { CrmToggleSwitch } from "@/components/settings/crm-toggle-switch";
import { useSystemStatus } from "@/hooks/use-system-status";

export function CrmSystemControl() {
  const { crmEnabled, isLoading, setCrmEnabled } = useSystemStatus();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingOff, setPendingOff] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleRequest = (next: boolean) => {
    if (next) {
      void applyToggle(true);
      return;
    }
    setPendingOff(true);
    setConfirmOpen(true);
  };

  const applyToggle = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      await setCrmEnabled({ crmEnabled: enabled });
      if (enabled) {
        toast.success("CRM is now online", {
          description: "Agents and users can access the platform normally.",
        });
      } else {
        toast.warning("Maintenance mode enabled", {
          description: "Only administrators can access the CRM.",
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update CRM status");
    } finally {
      setIsSaving(false);
      setConfirmOpen(false);
      setPendingOff(false);
    }
  };

  return (
    <>
      <GlassCard variant="gradient" padding="md" className="ds-animate-in overflow-hidden">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[var(--ds-shadow-sm)]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="ds-h3">System Control</h3>
                <p className="ds-caption text-muted-foreground">
                  Global CRM availability for all users
                </p>
              </div>
            </div>

            <StatusChip
              label={crmEnabled ? "Online" : "Maintenance Mode"}
              variant={crmEnabled ? "success" : "warning"}
              pulse={!crmEnabled}
            />
          </div>

          <div className="w-full lg:max-w-md">
            <CrmToggleSwitch
              checked={crmEnabled}
              onCheckedChange={handleToggleRequest}
              disabled={isLoading || isSaving}
              label="CRM availability"
              description={
                crmEnabled
                  ? "Agents can sign in and use the CRM."
                  : "Agents are blocked; only admins can access."
              }
            />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[hsl(var(--ds-glass-border))] bg-muted/30 p-4">
          <div className="flex gap-3">
            <Power className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">When OFF:</strong> agent login is disabled,
                protected routes show maintenance, and only admin accounts retain access.
              </p>
              <p>
                <strong className="text-foreground">When ON:</strong> full CRM functionality for
                all authorized roles.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      <Modal open={confirmOpen} onOpenChange={setConfirmOpen}>
        <ModalContent size="md">
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <ModalTitle>Enable maintenance mode?</ModalTitle>
                <ModalDescription>
                  This will immediately block agents from the CRM and show the maintenance screen.
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>Agent login will be disabled</li>
              <li>Active agent sessions will be redirected to maintenance</li>
              <li>Only administrators can access the system</li>
            </ul>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setPendingOff(false);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSaving || !pendingOff}
              onClick={() => void applyToggle(false)}
            >
              {isSaving ? "Applying…" : "Turn CRM OFF"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
