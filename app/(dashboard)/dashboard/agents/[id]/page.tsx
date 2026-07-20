import { notFound } from "next/navigation";
import { AgentDetailView } from "@/components/agents/agent-detail-view";
import { agentsService } from "@/services/agents.service";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const agent = await agentsService.getById(id);
    if (!agent) notFound();

    const [leads, performance] = await Promise.all([
      agentsService.getAssignedLeads(id),
      agentsService.getPerformanceSummary(id),
    ]);

    return <AgentDetailView agent={agent} leads={leads} performance={performance} />;
  } catch {
    notFound();
  }
}
