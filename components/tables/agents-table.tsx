"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/data-table";
import type { Agent } from "@/types/agent";

interface AgentsTableProps {
  data: Agent[];
  columns: ColumnDef<Agent>[];
}

export function AgentsTable({ data, columns }: AgentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <DataTable
        columns={columns}
        data={data}
        title="Agent Roster"
        description={`${data.length} team member${data.length === 1 ? "" : "s"}`}
        searchKey="name"
        searchPlaceholder="Search agents..."
      />
    </div>
  );
}
