"use client";

import { useState } from "react";
import { Check, IndianRupee, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/design-system/modal";
import { FormField } from "@/components/design-system/form-field";
import { FormInput } from "@/components/design-system/form-input";
import type { Lead } from "@/types/lead";
import { cn } from "@/lib/utils";

interface ConvertLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  isAdmin: boolean;
  onConverted: (lead: Lead) => void;
}

const PAYMENT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
] as const;

export function ConvertLeadModal({
  open,
  onOpenChange,
  lead,
  isAdmin,
  onConverted,
}: ConvertLeadModalProps) {
  const [fundAmount, setFundAmount] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setFundAmount("");
    setPaymentType("cash");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !fundAmount || isSaving) return;

    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid fund amount");
      return;
    }

    setIsSaving(true);
    try {
      const url = `/api/leads/${lead.id}/convert`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundAmount: amount,
          paymentType,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Conversion failed");

      toast.success(`Lead converted — Fund: ₹${amount.toLocaleString()}`);
      onConverted(data as Lead);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to convert");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Convert Lead</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <form id="convert-lead-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {lead && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/20">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {lead.fullName}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {lead.email || lead.phone || "No contact"}
                </p>
              </div>
            )}

            <FormField label="Fund Amount (₹)" htmlFor="fundAmount" required>
              <div className="relative">
                <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormInput
                  id="fundAmount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="5000"
                  className="pl-9"
                />
              </div>
            </FormField>

            <FormField label="Payment Type" htmlFor="paymentType" required>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => setPaymentType(pt.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      paymentType === pt.value
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Notes" htmlFor="conversionNotes">
              <textarea
                id="conversionNotes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this conversion..."
                className={cn(
                  "w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm",
                  "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                )}
              />
            </FormField>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="convert-lead-form"
            disabled={!fundAmount || isSaving}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Convert Lead
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
