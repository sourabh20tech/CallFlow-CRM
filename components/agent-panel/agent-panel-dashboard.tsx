"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/design-system/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AgentPanelStatsRow } from "@/components/agent-panel/agent-panel-stats-row";
import { AgentOverviewSection } from "@/components/agent-panel/agent-overview-section";
import { MyLeadsSection } from "@/components/agent-panel/my-leads-section";
import { TodayCallsSection } from "@/components/agent-panel/today-calls-section";
import { PendingFollowupsSection } from "@/components/agent-panel/pending-followups-section";
import { ConvertedLeadsSection } from "@/components/agent-panel/converted-leads-section";
import { AgentPanelSkeleton } from "@/components/agent-panel/agent-panel-skeleton";
import { AgentWorkspaceError } from "@/components/agent-panel/agent-workspace-error";
import { useAgentPanel } from "@/hooks/use-agent-panel";
import { buildAgentLeadLookup } from "@/lib/agent-panel/lead-lookup";
import type { AgentPanelBundle } from "@/types/agent-panel";
import { pageSection } from "@/lib/design-system/styles";

interface AgentPanelDashboardProps {
  initialData: AgentPanelBundle;
}

const TAB_HASH: Record<string, string> = {
  leads: "leads",
  calls: "calls",
  followups: "followups",
  converted: "converted",
};

function subscribeToHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function getHashTab() {
  const hash = window.location.hash.replace("#", "");
  return hash in TAB_HASH ? TAB_HASH[hash] : "overview";
}

export function AgentPanelDashboard({ initialData }: AgentPanelDashboardProps) {
  const { data, patchData, refresh, isRefreshing, error, isLoading } = useAgentPanel({
    initialData,
  });

  if (isLoading && !data) {
    return <AgentPanelSkeleton />;
  }

  if (error && !data) {
    return <AgentWorkspaceError message={error} />;
  }
  const activeTab = useSyncExternalStore(subscribeToHash, getHashTab, () => "overview");

  const panel = data ?? initialData;
  const leadLookup = useMemo(
    () => buildAgentLeadLookup([...panel.myLeads, ...panel.convertedLeads]),
    [panel.myLeads, panel.convertedLeads],
  );

  const handleRefresh = useCallback(async () => {
    const next = await refresh();
    if (!next) toast.error("Could not refresh workspace");
  }, [refresh]);

  const handleTabChange = (value: string) => {
    const entry = Object.entries(TAB_HASH).find(([, tab]) => tab === value);
    if (entry) {
      window.location.hash = entry[0];
      return;
    }
    if (value === "overview") {
      window.history.replaceState(null, "", window.location.pathname);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  };

  return (
    <div className={pageSection}>
      <PageHeader
        title="My Workspace"
        description={`Welcome back, ${panel.agentName} — manage leads, calls, and follow-ups`}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <AgentPanelStatsRow stats={panel.stats} />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="ds-animate-in space-y-[var(--ds-stack-gap)]"
      >
        <TabsList className="ds-glass flex h-auto w-full flex-wrap gap-1 p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="leads" className="text-xs sm:text-sm">
            My Leads
          </TabsTrigger>
          <TabsTrigger value="calls" className="text-xs sm:text-sm">
            Today&apos;s Calls
          </TabsTrigger>
          <TabsTrigger value="followups" className="text-xs sm:text-sm">
            Follow-Ups
          </TabsTrigger>
          <TabsTrigger value="converted" className="text-xs sm:text-sm">
            Converted
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <AgentOverviewSection
            data={panel}
            onLeadsChange={(myLeads) => patchData((d) => ({ ...d, myLeads }))}
            onCallsChange={(todayCalls) => patchData((d) => ({ ...d, todayCalls }))}
            onFollowupsChange={(pendingFollowups) =>
              patchData((d) => ({ ...d, pendingFollowups }))
            }
            onRefresh={() => void handleRefresh()}
          />
        </TabsContent>

        <TabsContent value="leads" className="mt-0">
          <MyLeadsSection
            leads={panel.myLeads}
            onLeadsChange={(myLeads) => patchData((d) => ({ ...d, myLeads }))}
            onRefresh={() => void handleRefresh()}
          />
        </TabsContent>

        <TabsContent value="calls" className="mt-0">
          <TodayCallsSection
            calls={panel.todayCalls}
            onCallsChange={(todayCalls) => patchData((d) => ({ ...d, todayCalls }))}
          />
        </TabsContent>

        <TabsContent value="followups" className="mt-0">
          <PendingFollowupsSection
            followups={panel.pendingFollowups}
            leadLookup={leadLookup}
            onFollowupsChange={(pendingFollowups) =>
              patchData((d) => ({ ...d, pendingFollowups }))
            }
            onRefresh={() => void handleRefresh()}
          />
        </TabsContent>

        <TabsContent value="converted" className="mt-0">
          <ConvertedLeadsSection leads={panel.convertedLeads} />
        </TabsContent>
      </Tabs>
      <p className="ds-caption pt-2 text-center">Copyright © 2026 CallFlow CRM</p>
    </div>
  );
}
