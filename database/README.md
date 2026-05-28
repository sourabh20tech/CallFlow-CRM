# Database

SQL migrations, schema reference, and query documentation for Call Center CRM.

## Migrations

Run in order from `database/migrations/`:

| File | Description |
|------|-------------|
| `000_enterprise_production_setup.sql` | Legacy bootstrap script for one-shot enterprise setup (optional, not used by normal incremental flow) |
| `001_profiles.sql` | Auth profiles, roles, triggers |
| `002_crm_schema.sql` | CRM tables, RLS, indexes |
| `003_system_settings.sql` | Global CRM on/off, maintenance |
| `003_lead_status_and_followup_date.sql` | Lead status/date alignment patch |
| `004_call_disposition_status.sql` | Call disposition statuses |
| `005_profiles_ensure_rpc.sql` | Backfill auth users → profiles, `ensure_current_user_profile` RPC |
| `006_profiles_phone.sql` | Profile phone support |
| `006_call_logs_stabilize.sql` | Call logs schema stabilization |
| `007_followups_calllogs_stabilize.sql` | Follow-up/call logs stability improvements |
| `008_followups_table_rename_alignment.sql` | Follow-up table naming alignment |
| `009_system_settings_schema_stabilize.sql` | System settings schema stabilization |
| `010_admin_announcement.sql` | Admin announcement fields |
| `011_lead_notes_table.sql` | Lead notes table and policies |

Apply via Supabase SQL Editor or CLI:

```bash
supabase db push
```

> **Note:** A mirror is kept under `supabase/migrations/` for Supabase CLI compatibility. Keep both trees in sync when adding migrations.

## Schemas

- TypeScript types: `types/database.ts`
- Regenerate: `npm run db:types`

## Queries

Server-side data access lives in `services/db/`. Do not query Supabase directly from UI components.

## Related

- Client config: `lib/supabase/`
- API routes: `app/api/`
