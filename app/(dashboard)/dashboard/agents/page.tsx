import { AgentsManagement } from "@/components/agents/agents-management";

export const metadata = {
  title: "Agent Management",
  description: "Create and manage call center agents, access, and assignments",
};

export default function AgentsPage() {
  return <AgentsManagement initialAgents={[]} canCreateAgents={true} />;
}
