-- Follow-ups + Call Logs stabilization (idempotent)
-- Ensures soft-delete columns, timestamps, and compatibility aliases exist.

alter table if exists public.call_logs
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.follow_ups
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.leads
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.agents
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists call_logs_not_deleted_idx
  on public.call_logs (id) where deleted_at is null;
create index if not exists follow_ups_not_deleted_idx
  on public.follow_ups (id) where deleted_at is null;
create index if not exists leads_not_deleted_idx
  on public.leads (id) where deleted_at is null;
create index if not exists agents_not_deleted_idx
  on public.agents (id) where deleted_at is null;

-- Compatibility alias for legacy environments expecting followups
create or replace view public.followups as
select * from public.follow_ups where deleted_at is null;

notify pgrst, 'reload schema';
