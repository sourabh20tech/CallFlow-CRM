-- CallFlow CRM — Core schema (leads, agents, call_logs, followups, notes)
-- Requires: 001_profiles.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.lead_tier as enum ('standard', 'premium', 'enterprise');
create type public.lead_status as enum (
  'new', 'contacted', 'qualified', 'negotiation', 'converted', 'lost'
);
create type public.agent_status as enum ('available', 'busy', 'away', 'offline');
create type public.call_direction as enum ('inbound', 'outbound');
create type public.call_status as enum (
  'queued', 'active', 'completed', 'missed', 'voicemail'
);
create type public.followup_status as enum (
  'pending', 'in_progress', 'completed', 'cancelled'
);
create type public.followup_priority as enum ('low', 'medium', 'high');

-- ---------------------------------------------------------------------------
-- Helpers (role checks for RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_agent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'agent'
  );
$$;

-- ---------------------------------------------------------------------------
-- Agents (1:1 with profile for users with role = agent)
-- ---------------------------------------------------------------------------
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  department text not null default 'General',
  status public.agent_status not null default 'offline',
  calls_handled integer not null default 0 check (calls_handled >= 0),
  avg_handle_time_seconds integer not null default 0 check (avg_handle_time_seconds >= 0),
  satisfaction_score numeric(3, 2) check (
    satisfaction_score is null
    or (satisfaction_score >= 0 and satisfaction_score <= 5)
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agents_profile_id_idx on public.agents (profile_id);
create index if not exists agents_status_idx on public.agents (status);
create index if not exists agents_department_idx on public.agents (department);

create or replace function public.current_agent_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.agents where profile_id = auth.uid() limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  company text,
  tier public.lead_tier not null default 'standard',
  status public.lead_status not null default 'new',
  source text,
  assigned_agent_id uuid references public.agents (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  converted_at timestamptz,
  last_contacted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_email_or_phone check (
    email is not null or phone is not null
  )
);

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_tier_idx on public.leads (tier);
create index if not exists leads_assigned_agent_idx on public.leads (assigned_agent_id);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_created_by_idx on public.leads (created_by);

-- ---------------------------------------------------------------------------
-- Call logs
-- ---------------------------------------------------------------------------
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  agent_id uuid references public.agents (id) on delete set null,
  direction public.call_direction not null default 'inbound',
  status public.call_status not null default 'queued',
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  summary text,
  recording_url text,
  external_call_id text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists call_logs_lead_id_idx on public.call_logs (lead_id);
create index if not exists call_logs_agent_id_idx on public.call_logs (agent_id);
create index if not exists call_logs_status_idx on public.call_logs (status);
create index if not exists call_logs_started_at_idx on public.call_logs (started_at desc);

-- ---------------------------------------------------------------------------
-- Follow-ups
-- ---------------------------------------------------------------------------
create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  assigned_agent_id uuid references public.agents (id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz not null,
  status public.followup_status not null default 'pending',
  priority public.followup_priority not null default 'medium',
  completed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists followups_lead_id_idx on public.followups (lead_id);
create index if not exists followups_assigned_agent_idx on public.followups (assigned_agent_id);
create index if not exists followups_due_at_idx on public.followups (due_at);
create index if not exists followups_status_idx on public.followups (status);

-- ---------------------------------------------------------------------------
-- Notes (polymorphic parent: lead and/or call_log and/or followup)
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  call_log_id uuid references public.call_logs (id) on delete cascade,
  followup_id uuid references public.followups (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_parent_required check (
    lead_id is not null
    or call_log_id is not null
    or followup_id is not null
  )
);

create index if not exists notes_lead_id_idx on public.notes (lead_id);
create index if not exists notes_call_log_id_idx on public.notes (call_log_id);
create index if not exists notes_followup_id_idx on public.notes (followup_id);
create index if not exists notes_author_id_idx on public.notes (author_id);
create index if not exists notes_created_at_idx on public.notes (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists agents_updated_at on public.agents;
create trigger agents_updated_at
  before update on public.agents
  for each row execute function public.set_updated_at();

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

drop trigger if exists call_logs_updated_at on public.call_logs;
create trigger call_logs_updated_at
  before update on public.call_logs
  for each row execute function public.set_updated_at();

drop trigger if exists followups_updated_at on public.followups;
create trigger followups_updated_at
  before update on public.followups
  for each row execute function public.set_updated_at();

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- Auto-create agents row when profile role is agent
create or replace function public.handle_agent_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'agent' then
    insert into public.agents (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_agent_created on public.profiles;
create trigger on_profile_agent_created
  after insert on public.profiles
  for each row execute function public.handle_agent_profile();

-- Backfill agents for existing agent profiles
insert into public.agents (profile_id)
select id from public.profiles
where role = 'agent'
on conflict (profile_id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.agents enable row level security;
alter table public.leads enable row level security;
alter table public.call_logs enable row level security;
alter table public.followups enable row level security;
alter table public.notes enable row level security;

-- AGENTS policies
create policy "agents_select_admin"
  on public.agents for select
  using (public.is_admin());

create policy "agents_select_own"
  on public.agents for select
  using (profile_id = auth.uid());

create policy "agents_insert_admin"
  on public.agents for insert
  with check (public.is_admin());

create policy "agents_update_admin"
  on public.agents for update
  using (public.is_admin());

create policy "agents_update_own_status"
  on public.agents for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "agents_delete_admin"
  on public.agents for delete
  using (public.is_admin());

-- LEADS policies
create policy "leads_select_admin"
  on public.leads for select
  using (public.is_admin());

create policy "leads_select_assigned_agent"
  on public.leads for select
  using (assigned_agent_id = public.current_agent_id());

create policy "leads_select_created_by"
  on public.leads for select
  using (created_by = auth.uid());

create policy "leads_insert_authenticated"
  on public.leads for insert
  with check (
    auth.uid() is not null
    and (public.is_admin() or public.is_agent())
    and created_by = auth.uid()
  );

create policy "leads_update_admin"
  on public.leads for update
  using (public.is_admin());

create policy "leads_update_assigned_agent"
  on public.leads for update
  using (assigned_agent_id = public.current_agent_id());

create policy "leads_delete_admin"
  on public.leads for delete
  using (public.is_admin());

-- CALL_LOGS policies
create policy "call_logs_select_admin"
  on public.call_logs for select
  using (public.is_admin());

create policy "call_logs_select_own_agent"
  on public.call_logs for select
  using (agent_id = public.current_agent_id());

create policy "call_logs_select_lead_access"
  on public.call_logs for select
  using (
    exists (
      select 1 from public.leads l
      where l.id = call_logs.lead_id
        and (
          l.assigned_agent_id = public.current_agent_id()
          or l.created_by = auth.uid()
        )
    )
  );

create policy "call_logs_insert_authenticated"
  on public.call_logs for insert
  with check (
    auth.uid() is not null
    and (public.is_admin() or agent_id = public.current_agent_id())
  );

create policy "call_logs_update_admin"
  on public.call_logs for update
  using (public.is_admin());

create policy "call_logs_update_own_agent"
  on public.call_logs for update
  using (agent_id = public.current_agent_id());

create policy "call_logs_delete_admin"
  on public.call_logs for delete
  using (public.is_admin());

-- FOLLOWUPS policies
create policy "followups_select_admin"
  on public.followups for select
  using (public.is_admin());

create policy "followups_select_assigned"
  on public.followups for select
  using (assigned_agent_id = public.current_agent_id());

create policy "followups_select_lead_access"
  on public.followups for select
  using (
    exists (
      select 1 from public.leads l
      where l.id = followups.lead_id
        and l.assigned_agent_id = public.current_agent_id()
    )
  );

create policy "followups_insert_authenticated"
  on public.followups for insert
  with check (
    auth.uid() is not null
    and (public.is_admin() or assigned_agent_id = public.current_agent_id())
  );

create policy "followups_update_admin"
  on public.followups for update
  using (public.is_admin());

create policy "followups_update_assigned"
  on public.followups for update
  using (assigned_agent_id = public.current_agent_id());

create policy "followups_delete_admin"
  on public.followups for delete
  using (public.is_admin());

-- NOTES policies
create policy "notes_select_admin"
  on public.notes for select
  using (public.is_admin());

create policy "notes_select_author"
  on public.notes for select
  using (author_id = auth.uid());

create policy "notes_select_lead_access"
  on public.notes for select
  using (
    lead_id is not null
    and exists (
      select 1 from public.leads l
      where l.id = notes.lead_id
        and (
          l.assigned_agent_id = public.current_agent_id()
          or l.created_by = auth.uid()
        )
    )
  );

create policy "notes_insert_authenticated"
  on public.notes for insert
  with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and (public.is_admin() or public.is_agent())
  );

create policy "notes_update_author"
  on public.notes for update
  using (author_id = auth.uid());

create policy "notes_update_admin"
  on public.notes for update
  using (public.is_admin());

create policy "notes_delete_author"
  on public.notes for delete
  using (author_id = auth.uid());

create policy "notes_delete_admin"
  on public.notes for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Views (optional analytics helpers)
-- ---------------------------------------------------------------------------
create or replace view public.lead_stats as
select
  count(*)::bigint as total_leads,
  count(*) filter (where status = 'converted')::bigint as converted_leads,
  count(*) filter (where status not in ('converted', 'lost'))::bigint as active_leads
from public.leads;

-- Grant authenticated access to views (inherits underlying RLS on base tables when security invoker)
-- Use security_barrier on view in PG15+; for simplicity admins/agents query base tables from app.

comment on table public.leads is 'CRM lead / prospect records';
comment on table public.agents is 'Call center agents linked to auth profiles';
comment on table public.call_logs is 'Inbound/outbound call history per lead';
comment on table public.followups is 'Scheduled follow-up tasks';
comment on table public.notes is 'Notes attached to leads, calls, or follow-ups';
