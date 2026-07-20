import { FollowupsManagement } from "@/components/followups";

export const metadata = {
  title: "Follow-Up Management",
  description: "Schedule, track pending tasks, and review completed follow-ups",
};

export default function FollowUpsPage() {
  return (
    <FollowupsManagement
      initialFollowups={[]}
      initialStats={{ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, dueToday: 0 }}
      initialReminders={{ overdue: [], dueToday: [], upcoming: [] }}
      initialAgents={[]}
      dialLeads={[]}
      rosterAgents={[]}
    />
  );
}
