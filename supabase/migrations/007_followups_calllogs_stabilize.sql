-- Follow-ups + Call Logs stabilization (idempotent)
-- Ensures table name alignment, soft-delete columns, timestamps, and indexes.

-- Step 1: Rename followups → follow_ups if needed (originally in 008)
do $$
begin
  if to_regclass('public.follow_ups') is null and to_regclass('public.followups') is not null then
    execute 'alter table public.followups rename to follow_ups';
  end if;
end $$;

-- Step 2: Add soft-delete and timestamp columns
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

-- Step 3: Indexes for soft-delete queries
create index if not exists call_logs_not_deleted_idx
  on public.call_logs (id) where deleted_at is null;
create index if not exists follow_ups_not_deleted_idx
  on public.follow_ups (id) where deleted_at is null;
create index if not exists leads_not_deleted_idx
  on public.leads (id) where deleted_at is null;
create index if not exists agents_not_deleted_idx
  on public.agents (id) where deleted_at is null;

-- Step 4: Compatibility view
create or replace view public.followups as
select * from public.follow_ups where deleted_at is null;

notify pgrst, 'reload schema';
