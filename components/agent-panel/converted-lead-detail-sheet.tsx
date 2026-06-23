"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, IndianRupee, Loader2, Plus, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusChip } from "@/components/design-system/status-chip";
import { GlassCard } from "@/components/design-system/glass-card";
import { LeadNotesPanel } from "@/components/agent-panel/lead-notes-panel";
import { LeadContactBlock } from "@/components/agent-panel/lead-contact-block";
import { WhatsAppChatButton } from "@/components/shared/whatsapp-chat-button";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/design-system/form-input";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import type { AgentPanelLead } from "@/types/agent-panel";
import { cn } from "@/lib/utils";

interface FundEntry {
  id: string;
  amount: number;
  payment_type: string;
  notes: string | null;
  created_at: string;
}

interface ConvertedLeadDetailSheetProps {
  lead: AgentPanelLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function ConvertedLeadDetailSheet({
  lead,
  open,
  onOpenChange,
}: ConvertedLeadDetailSheetProps) {
  const [funds, setFunds] = useState<FundEntry[]>([]);
  const [totalFund, setTotalFund] = useState(0);
  const [isLoadingFunds, setIsLoadingFunds] = useState(false);
  const [showAddFund, setShowAddFund] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadFunds = useCallback(async () => {
    if (!lead) return;
    setIsLoadingFunds(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/funds`);
      if (!res.ok) return;
      const data = await res.json();
      setFunds(data.funds ?? []);
      setTotalFund(data.totalFund ?? 0);
    } catch {} finally {
      setIsLoadingFunds(false);
    }
  }, [lead]);

  useEffect(() => {
    if (open && lead) {
      void loadFunds();
    }
  }, [open, lead, loadFunds]);

  const handleAddFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !newAmount || isSaving) return;

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, notes: newNotes.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Fund ${formatCurrency(amount)} added`);
      setNewAmount("");
      setNewNotes("");
      setShowAddFund(false);
      void loadFunds();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add fund");
    } finally {
      setIsSaving(false);
    }
  };

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-500" />
            {lead.fullName}
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <StatusChip label="Converted" variant="success" size="sm" />
            {lead.convertedAt && (
              <span>
                {new Date(lead.convertedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <LeadContactBlock
            email={lead.email}
            phone={lead.phone}
            phoneAction={
              <WhatsAppChatButton
                phone={lead.phone}
                message={WHATSAPP_TEMPLATES.inquiryFollowup}
                label={`WhatsApp ${lead.fullName}`}
              />
            }
          />

          {/* Fund Section */}
          <GlassCard variant="default" padding="sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-500" />
                <h4 className="text-sm font-semibold">Fund</h4>
              </div>
              <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalFund)}
              </span>
            </div>

            {/* Fund History */}
            {isLoadingFunds ? (
              <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading...
              </div>
            ) : funds.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {funds.map((f) => (
                  <div key={f.id} className="flex items-start justify-between rounded-md border border-border/40 px-2.5 py-1.5 text-xs">
                    <div>
                      <span className="font-semibold tabular-nums">{formatCurrency(f.amount)}</span>
                      <span className="ml-2 text-muted-foreground capitalize">{f.payment_type.replace("_", " ")}</span>
                      {f.notes && (
                        <p className="mt-0.5 text-muted-foreground">{f.notes}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {new Date(f.created_at).toLocaleDateString(undefined, { dateStyle: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-2 text-xs text-muted-foreground">No fund records.</p>
            )}

            {/* Add Fund */}
            {showAddFund ? (
              <form onSubmit={(e) => void handleAddFund(e)} className="space-y-2 border-t border-border/40 pt-2">
                <div className="relative">
                  <IndianRupee className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <FormInput
                    type="number"
                    min="1"
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="Amount"
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <FormInput
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="h-8 text-xs"
                />
                <div className="flex gap-1.5">
                  <Button type="submit" size="sm" className="h-7 gap-1 text-xs" disabled={!newAmount || isSaving}>
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddFund(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs"
                onClick={() => setShowAddFund(true)}
              >
                <Plus className="h-3 w-3" />
                Add Fund
              </Button>
            )}
          </GlassCard>

          <LeadNotesPanel leadId={lead.id} readOnly />
        </div>
      </SheetContent>
    </Sheet>
  );
}
