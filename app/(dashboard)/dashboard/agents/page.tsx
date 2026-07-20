import { requireAdmin } from "@/lib/auth/guards";
import { AgentsManagement } from "@/components/agents/agents-management";
import { agentsService } from "@/services/agents.service";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { GlassCard } from "@/components/design-system/glass-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agent Management",
  description: "Create and manage call center agents, access, and assignments",
};

export default async function AgentsPage() {
  await requireAdmin();

  // Pre-resolve capabilities server-side (eliminates client /api/agents/capabilities call)
  const canCreateAgents = isAdminClientConfigured();

  try {
    const agents = await agentsService.getAll(true);
    return <AgentsManagement initialAgents={agents} canCreateAgents={canCreateAgents} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load agents";

    return (
      <GlassCard variant="gradient" padding="lg" className="mx-auto max-w-lg text-center">
        <h1 className="ds-h2">Agent Management</h1>
        <p className="mt-2 text-sm text-destructive">{message}</p>
        <p className="ds-caption mt-4 text-muted-foreground">
          Verify Supabase credentials and run database migrations, then refresh this page.
        </p>
      </GlassCard>
    );
  }
}
