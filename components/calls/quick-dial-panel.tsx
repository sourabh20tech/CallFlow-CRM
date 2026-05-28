"use client";

import { useMemo, useState } from "react";
import { Phone, Search } from "lucide-react";
import { GlassCard } from "@/components/design-system/glass-card";
import { QuickCallButton } from "@/components/calls/quick-call-button";
import { Input } from "@/components/ui/input";
import type { DialLead } from "@/lib/calls/dial-leads";

interface QuickDialPanelProps {
  leads: DialLead[];
  onCallInitiated: () => void;
}

export function QuickDialPanel({ leads, onCallInitiated }: QuickDialPanelProps) {
  const [search, setSearch] = useState("");
  const [callingId, setCallingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.company?.toLowerCase().includes(q),
    );
  }, [leads, search]);

  return (
    <GlassCard
      variant="gradient"
      padding="md"
      className="ds-animate-in h-fit lg:sticky lg:top-24"
      data-quick-dial
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[var(--ds-shadow-sm)]">
          <Phone className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Quick dial</h3>
          <p className="text-xs text-muted-foreground">One-click outbound calls</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <ul className="max-h-[320px] space-y-2 overflow-y-auto scrollbar-thin pr-1">
        {filtered.map((lead) => (
          <li
            key={lead.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{lead.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {lead.phone ?? "No phone"} {lead.company ? `· ${lead.company}` : ""}
              </p>
            </div>
            <QuickCallButton
              leadId={lead.id}
              leadName={lead.name}
              phone={lead.phone}
              isLoading={callingId === lead.id}
              onCallStart={() => setCallingId(lead.id)}
              onCallComplete={() => setCallingId(null)}
              onCallInitiated={onCallInitiated}
            />
          </li>
        ))}
        {!filtered.length && (
          <li className="py-6 text-center text-sm text-muted-foreground">No leads found</li>
        )}
      </ul>
    </GlassCard>
  );
}
