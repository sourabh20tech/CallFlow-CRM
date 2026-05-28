-- Call logs module stabilization — idempotent schema alignment with app queries
-- Run in Supabase SQL Editor if call_logs pages fail with empty PostgREST errors.

-- ---------------------------------------------------------------------------
-- call_logs: columns expected by services/db/call-logs.service.ts
-- ---------------------------------------------------------------------------
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  agent_id uuid references public.agents (id) on delete set null,
  direction public.call_direction not null default 'outbound',
  status public.call_status not null default 'callback',
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  summary text,
  recording_url text,
  external_call_id text,
  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.call_logs add column if not exists deleted_at timestamptz;
alter table public.call_logs add column if not exists recording_url text;
alter table public.call_logs add column if not exists duration_seconds integer;
alter table public.call_logs add column if not exists started_at timestamptz not null default timezone('utc', now());
alter table public.call_logs add column if not exists ended_at timestamptz;
alter table public.call_logs add column if not exists summary text;
alter table public.call_logs add column if not exists agent_id uuid references public.agents (id) on delete set null;
alter table public.call_logs add column if not exists lead_id uuid references public.leads (id) on delete cascade;
alter table public.call_logs add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.call_logs add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists call_logs_lead_id_idx on public.call_logs (lead_id);
create index if not exists call_logs_agent_id_idx on public.call_logs (agent_id);
create index if not exists call_logs_status_idx on public.call_logs (status);
create index if not exists call_logs_started_at_idx on public.call_logs (started_at desc);
create index if not exists call_logs_not_deleted_idx on public.call_logs (id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Related tables used by call log joins / note counts / search
-- ---------------------------------------------------------------------------
alter table public.leads add column if not exists deleted_at timestamptz;
alter table public.notes add column if not exists deleted_at timestamptz;
alter table public.agents add column if not exists deleted_at timestamptz;

alter table public.notes add column if not exists call_log_id uuid references public.call_logs (id) on delete cascade;
create index if not exists notes_call_log_id_idx on public.notes (call_log_id);

notify pgrst, 'reload schema';

comment on table public.call_logs is 'Inbound/outbound call history (CRM call logs module)';
