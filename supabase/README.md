# Supabase CLI

Migrations are maintained in **`database/migrations/`** (canonical). This folder mirrors them for Supabase CLI compatibility.

## Migrations (run in order)

1. `001_profiles.sql` — Auth profiles, roles, triggers
2. `002_crm_schema.sql` — CRM tables, RLS, indexes
3. `003_system_settings.sql` — Global CRM on/off and maintenance settings
4. `003_lead_status_and_followup_date.sql` — Lead status/date alignment patch
5. `004_call_disposition_status.sql` — Call disposition statuses
6. `005_profiles_ensure_rpc.sql` — Profile ensure RPC and backfill helpers
7. `006_profiles_phone.sql` — Profile phone field support
8. `006_call_logs_stabilize.sql` — Call log stability fixes
9. `007_followups_calllogs_stabilize.sql` — Follow-up/call-log stabilization
10. `008_followups_table_rename_alignment.sql` — Follow-up table naming alignment
11. `009_system_settings_schema_stabilize.sql` — System settings schema stabilization
12. `010_admin_announcement.sql` — Admin announcement fields
13. `011_lead_notes_table.sql` — Lead notes table and policies

See [database/README.md](../database/README.md) for full documentation.

## Schema overview

```
profiles (auth.users)
    └── agents (1:1, role = agent)
            ├── leads.assigned_agent_id
            ├── call_logs.agent_id
            └── follow_ups.assigned_agent_id

leads
    ├── call_logs (1:N, cascade delete)
    ├── follow_ups (1:N, cascade delete)
    └── lead_notes (optional FK)

call_logs ── lead_notes
follow_ups ── lead_notes
```

## Tables

| Table       | Purpose                          |
| ----------- | -------------------------------- |
| `leads`     | Prospects / pipeline             |
| `agents`    | Agent workforce (links profile)  |
| `call_logs` | Call history per lead            |
| `follow_ups` | Scheduled tasks                 |
| `lead_notes` | Notes on lead/call/follow-up    |
| `system_settings` | Global CRM on/off (singleton) |

## System control

Admins toggle CRM availability from **Settings → System Control**. When `crm_enabled` is `false`:

- Agents are redirected to `/maintenance`
- Agent login is blocked at the edge and in the login form
- Only admins retain access (dashboard + settings)

## RLS summary

| Role  | Leads              | Agents        | Calls / Follow-ups / Notes      |
| ----- | ------------------ | ------------- | ------------------------------- |
| Admin | Full CRUD          | Full CRUD     | Full CRUD                       |
| Agent | Assigned + created | Own row read/update status | Assigned + related lead access |

## App integration

```ts
import { leadsDbService } from "@/services/db";
import { subscribeToTable } from "@/lib/db/realtime";
import { createBrowserSupabaseClient } from "@/lib/supabase/typed-client";
```

## Regenerate types

```bash
npx supabase gen types typescript --project-id <your-project-id> > types/database.generated.ts
```

Merge or replace `types/database.ts` after schema changes.

## Realtime (optional)

Enable replication for tables in Supabase Dashboard → Database → Replication, then:

```ts
const supabase = createBrowserSupabaseClient();
const channel = subscribeToTable(supabase, "leads", {
  onPayload: () => refetch(),
});
```

## Service role

Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` for server-only admin operations (`lib/supabase/admin.ts`). Never expose to the client.
