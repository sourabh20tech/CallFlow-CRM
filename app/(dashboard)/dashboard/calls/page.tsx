import { CallsManagement } from "@/components/calls";
import { EMPTY_CALL_STATS } from "@/lib/db/call-logs-query";

export const metadata = {
  title: "Call Management",
  description: "Dial, log calls, notes, and call history",
};

export default function CallsPage() {
  return (
    <CallsManagement
      initialCalls={[]}
      initialTotal={0}
      initialPage={1}
      initialTotalPages={1}
      initialStats={{ ...EMPTY_CALL_STATS }}
      dialLeads={[]}
    />
  );
}
