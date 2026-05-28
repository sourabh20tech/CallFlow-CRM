-- =============================================================================
-- Call Center CRM — Enterprise Production Setup (Supabase PostgreSQL)
-- Idempotent: safe on fresh project OR existing migrations 001–006
-- Run once in Supabase SQL Editor (as postgres / service role)
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ENUMS (admin/agent roles + CRM domain)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.lead_tier as enum ('standard', 'premium', 'enterprise');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.lead_status as enum (
    'new', 'interested', 'follow_up', 'converted', 'not_interested', 'closed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.agent_status as enum ('available', 'busy', 'away', 'offline');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.call_direction as enum ('inbound', 'outbound');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.call_status as enum (
    'connected', 'busy', 'no_answer', 'callback', 'interested', 'not_interested'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.followup_status as enum (
    'pending', 'in_progress', 'completed', 'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.followup_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.activity_action as enum (
    'create', 'update', 'delete', 'assign', 'convert', 'call', 'followup', 'login', 'status_change'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_type as enum (
    'daily', 'agent_performance', 'lead_conversion', 'call_statistics', 'dashboard_snapshot'
  );
exception when duplicate_object then null;
end $$;

-- Migrate legacy lead_status enum values if old type exists
do $$
begin
  if exists (
    select 1 from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'lead_status' and e.enumlabel = 'contacted'
  ) then
    create type public.lead_status_new as enum (
      'new', 'interested', 'follow_up', 'converted', 'not_interested', 'closed'
    );
    alter table public.leads alter column status drop default;
    alter table public.leads
      alter column status type public.lead_status_new
      using (
        case status::text
          when 'new' then 'new'::public.lead_status_new
          when 'contacted' then 'interested'::public.lead_status_new
          when 'qualified' then 'follow_up'::public.lead_status_new
          when 'negotiation' then 'follow_up'::public.lead_status_new
          when 'converted' then 'converted'::public.lead_status_new
          when 'lost' then 'not_interested'::public.lead_status_new
          else 'new'::public.lead_status_new
        end
      );
    drop type public.lead_status;
    alter type public.lead_status_new rename to lead_status;
    alter table public.leads alter column status set default 'new'::public.lead_status;
  end if;
end $$;

-- Migrate legacy call_status enum if needed
do $$
begin
  if exists (
    select 1 from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'call_status' and e.enumlabel = 'queued'
  ) then
    create type public.call_status_new as enum (
      'connected', 'busy', 'no_answer', 'callback', 'interested', 'not_interested'
    );
    alter table public.call_logs alter column status drop default;
    alter table public.call_logs
      alter column status type public.call_status_new
      using (
        case status::text
          when 'queued' then 'callback'::public.call_status_new
          when 'active' then 'connected'::public.call_status_new
          when 'completed' then 'connected'::public.call_status_new
          when 'missed' then 'no_answer'::public.call_status_new
          when 'voicemail' then 'no_answer'::public.call_status_new
          else 'callback'::public.call_status_new
        end
      );
    drop type public.call_status;
    alter type public.call_status_new rename to call_status;
    alter table public.call_logs alter column status set default 'callback'::public.call_status;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- UTILITY FUNCTIONS
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

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

create or replace function public.current_agent_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.agents
  where profile_id = auth.uid()
    and deleted_at is null
  limit 1;
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 1. PROFILES (auth.users → CRM identity + role)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'agent',
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar_url text;

create unique index if not exists profiles_email_lower_unique_idx
  on public.profiles (lower(trim(email)));

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_email_idx on public.profiles (email);

-- Signup trigger: auto profile + role from metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  assigned_role := coalesce(
    nullif(new.raw_user_meta_data->>'role', ''),
    'agent'
  );

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    nullif(new.raw_user_meta_data->>'phone', ''),
    assigned_role
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      phone = coalesce(public.profiles.phone, excluded.phone);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Login-time profile ensure (agent/admin portals)
create or replace function public.ensure_current_user_profile(requested_role text default null)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  auth_email text;
  auth_meta jsonb;
  assigned_role text;
  existing public.profiles;
  created public.profiles;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into existing from public.profiles where id = uid;
  if found then
    return existing;
  end if;

  select email, raw_user_meta_data into auth_email, auth_meta
  from auth.users where id = uid;

  assigned_role := coalesce(
    nullif(requested_role, ''),
    nullif(auth_meta->>'role', ''),
    'agent'
  );

  insert into public.profiles (id, email, full_name, role)
  values (
    uid,
    coalesce(auth_email, ''),
    coalesce(auth_meta->>'full_name', split_part(coalesce(auth_email, 'user'), '@', 1)),
    assigned_role
  )
  on conflict (id) do update set email = excluded.email
  returning * into created;

  return created;
end;
$$;

revoke all on function public.ensure_current_user_profile(text) from public;
grant execute on function public.ensure_current_user_profile(text) to authenticated;
grant execute on function public.ensure_current_user_profile(text) to service_role;

-- ---------------------------------------------------------------------------
-- 2. AGENTS
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
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.agents add column if not exists deleted_at timestamptz;
alter table public.agents add column if not exists is_active boolean not null default true;

create index if not exists agents_profile_id_idx on public.agents (profile_id);
create index if not exists agents_status_idx on public.agents (status);
create index if not exists agents_department_idx on public.agents (department);
create index if not exists agents_active_idx on public.agents (is_active) where deleted_at is null;
create index if not exists agents_not_deleted_idx on public.agents (id) where deleted_at is null;

drop trigger if exists agents_updated_at on public.agents;
create trigger agents_updated_at
  before update on public.agents
  for each row execute function public.set_updated_at();

-- Auto agents row when profile role = agent
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

-- ---------------------------------------------------------------------------
-- 3. LEADS
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
  next_follow_up_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint leads_email_or_phone check (email is not null or phone is not null)
);

alter table public.leads add column if not exists next_follow_up_at timestamptz;
alter table public.leads add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.leads add column if not exists deleted_at timestamptz;

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_tier_idx on public.leads (tier);
create index if not exists leads_assigned_agent_idx on public.leads (assigned_agent_id);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_created_by_idx on public.leads (created_by);
create index if not exists leads_next_follow_up_idx on public.leads (next_follow_up_at);
create index if not exists leads_not_deleted_idx on public.leads (id) where deleted_at is null;
create index if not exists leads_search_idx on public.leads using gin (
  to_tsvector(
    'english',
    coalesce(full_name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(company, '')
  )
);

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- Auto-set converted_at when status becomes converted
create or replace function public.handle_lead_conversion()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'converted'::public.lead_status
     and (old.status is distinct from new.status) then
    new.converted_at := coalesce(new.converted_at, timezone('utc', now()));
  end if;
  return new;
end;
$$;

drop trigger if exists leads_conversion on public.leads;
create trigger leads_conversion
  before update on public.leads
  for each row execute function public.handle_lead_conversion();

-- ---------------------------------------------------------------------------
-- 4. CALL LOGS
-- ---------------------------------------------------------------------------
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  agent_id uuid references public.agents (id) on delete set null,
  direction public.call_direction not null default 'inbound',
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

create index if not exists call_logs_lead_id_idx on public.call_logs (lead_id);
create index if not exists call_logs_agent_id_idx on public.call_logs (agent_id);
create index if not exists call_logs_status_idx on public.call_logs (status);
create index if not exists call_logs_started_at_idx on public.call_logs (started_at desc);
create index if not exists call_logs_not_deleted_idx on public.call_logs (id) where deleted_at is null;

drop trigger if exists call_logs_updated_at on public.call_logs;
create trigger call_logs_updated_at
  before update on public.call_logs
  for each row execute function public.set_updated_at();

-- Update agent metrics on call completion
create or replace function public.sync_agent_call_metrics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.agent_id is not null and new.duration_seconds > 0 then
    update public.agents
    set
      calls_handled = calls_handled + 1,
      avg_handle_time_seconds = case
        when calls_handled <= 0 then new.duration_seconds
        else round((avg_handle_time_seconds::numeric * calls_handled + new.duration_seconds) / (calls_handled + 1))::integer
      end
    where id = new.agent_id;
  end if;
  return new;
end;
$$;

drop trigger if exists call_logs_agent_metrics on public.call_logs;
create trigger call_logs_agent_metrics
  after insert on public.call_logs
  for each row execute function public.sync_agent_call_metrics();

-- ---------------------------------------------------------------------------
-- 5. FOLLOW-UPS (app table: followups — view alias: follow_ups)
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
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.followups add column if not exists deleted_at timestamptz;

create index if not exists followups_lead_id_idx on public.followups (lead_id);
create index if not exists followups_assigned_agent_idx on public.followups (assigned_agent_id);
create index if not exists followups_due_at_idx on public.followups (due_at);
create index if not exists followups_status_idx on public.followups (status);
create index if not exists followups_pending_idx on public.followups (due_at)
  where status in ('pending', 'in_progress') and deleted_at is null;

drop trigger if exists followups_updated_at on public.followups;
create trigger followups_updated_at
  before update on public.followups
  for each row execute function public.set_updated_at();

create or replace function public.handle_followup_completion()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed'::public.followup_status
     and (old.status is distinct from new.status) then
    new.completed_at := coalesce(new.completed_at, timezone('utc', now()));
  end if;
  return new;
end;
$$;

drop trigger if exists followups_completion on public.followups;
create trigger followups_completion
  before update on public.followups
  for each row execute function public.handle_followup_completion();

create or replace view public.follow_ups
with (security_invoker = true)
as
select * from public.followups where deleted_at is null;

comment on view public.follow_ups is 'Alias view for followups (pending/completed/scheduled tasks)';

-- ---------------------------------------------------------------------------
-- 6. LEAD NOTES (app table: notes — view alias: lead_notes)
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  call_log_id uuid references public.call_logs (id) on delete cascade,
  followup_id uuid references public.followups (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  is_pinned boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint notes_parent_required check (
    lead_id is not null or call_log_id is not null or followup_id is not null
  )
);

alter table public.notes add column if not exists deleted_at timestamptz;

create index if not exists notes_lead_id_idx on public.notes (lead_id);
create index if not exists notes_call_log_id_idx on public.notes (call_log_id);
create index if not exists notes_followup_id_idx on public.notes (followup_id);
create index if not exists notes_author_id_idx on public.notes (author_id);
create index if not exists notes_created_at_idx on public.notes (created_at desc);

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create or replace view public.lead_notes
with (security_invoker = true)
as
select
  id,
  lead_id,
  author_id,
  content,
  is_pinned,
  deleted_at,
  created_at,
  updated_at
from public.notes
where lead_id is not null and deleted_at is null;

comment on view public.lead_notes is 'Lead-scoped notes (subset of public.notes)';

-- ---------------------------------------------------------------------------
-- 7. REPORTS (persisted analytics snapshots)
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  report_type public.report_type not null,
  report_date date not null default (timezone('utc', now()))::date,
  scope text not null default 'global' check (scope in ('global', 'agent')),
  agent_id uuid references public.agents (id) on delete set null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists reports_type_date_idx on public.reports (report_type, report_date desc);
create index if not exists reports_agent_idx on public.reports (agent_id);

create unique index if not exists reports_unique_daily_global
  on public.reports (report_type, report_date)
  where scope = 'global' and agent_id is null;

create unique index if not exists reports_unique_daily_agent
  on public.reports (report_type, report_date, agent_id)
  where scope = 'agent' and agent_id is not null;

drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. DASHBOARD STATS (materialized counters per day / agent)
-- ---------------------------------------------------------------------------
create table if not exists public.dashboard_stats (
  id uuid primary key default gen_random_uuid(),
  stat_date date not null default (timezone('utc', now()))::date,
  scope text not null default 'global' check (scope in ('global', 'agent')),
  agent_id uuid references public.agents (id) on delete cascade,
  total_leads integer not null default 0,
  converted_leads integer not null default 0,
  pending_followups integer not null default 0,
  total_calls integer not null default 0,
  active_agents integer not null default 0,
  conversion_rate numeric(5, 2) not null default 0,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists dashboard_stats_unique_global
  on public.dashboard_stats (stat_date)
  where scope = 'global' and agent_id is null;

create unique index if not exists dashboard_stats_unique_agent
  on public.dashboard_stats (stat_date, agent_id)
  where scope = 'agent' and agent_id is not null;

create index if not exists dashboard_stats_date_idx on public.dashboard_stats (stat_date desc);

drop trigger if exists dashboard_stats_updated_at on public.dashboard_stats;
create trigger dashboard_stats_updated_at
  before update on public.dashboard_stats
  for each row execute function public.set_updated_at();

-- Refresh global dashboard snapshot
create or replace function public.refresh_dashboard_stats(p_stat_date date default (timezone('utc', now()))::date)
returns public.dashboard_stats
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.dashboard_stats;
  v_total_leads integer;
  v_converted integer;
  v_pending_fu integer;
  v_total_calls integer;
  v_active_agents integer;
  v_rate numeric(5, 2);
begin
  select count(*)::integer into v_total_leads
  from public.leads where deleted_at is null;

  select count(*)::integer into v_converted
  from public.leads where deleted_at is null and status = 'converted';

  select count(*)::integer into v_pending_fu
  from public.followups
  where deleted_at is null and status in ('pending', 'in_progress');

  select count(*)::integer into v_total_calls
  from public.call_logs where deleted_at is null;

  select count(*)::integer into v_active_agents
  from public.agents where deleted_at is null and is_active = true;

  v_rate := case when v_total_leads > 0
    then round((v_converted::numeric / v_total_leads::numeric) * 100, 2)
    else 0 end;

  update public.dashboard_stats
  set
    total_leads = v_total_leads,
    converted_leads = v_converted,
    pending_followups = v_pending_fu,
    total_calls = v_total_calls,
    active_agents = v_active_agents,
    conversion_rate = v_rate,
    metrics = jsonb_build_object('refreshed_at', timezone('utc', now())),
    updated_at = timezone('utc', now())
  where stat_date = p_stat_date and scope = 'global' and agent_id is null
  returning * into result;

  if result.id is null then
    insert into public.dashboard_stats (
      stat_date, scope, agent_id,
      total_leads, converted_leads, pending_followups, total_calls, active_agents, conversion_rate,
      metrics
    )
    values (
      p_stat_date, 'global', null,
      v_total_leads, v_converted, v_pending_fu, v_total_calls, v_active_agents, v_rate,
      jsonb_build_object('refreshed_at', timezone('utc', now()))
    )
    returning * into result;
  end if;

  return result;
end;
$$;

revoke all on function public.refresh_dashboard_stats(date) from public;
grant execute on function public.refresh_dashboard_stats(date) to authenticated;
grant execute on function public.refresh_dashboard_stats(date) to service_role;

-- ---------------------------------------------------------------------------
-- 9. ACTIVITY LOGS (audit trail)
-- ---------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action public.activity_action not null,
  entity_type text not null,
  entity_id uuid,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists activity_logs_actor_idx on public.activity_logs (actor_id);
create index if not exists activity_logs_entity_idx on public.activity_logs (entity_type, entity_id);
create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);

create or replace function public.log_activity(
  p_action public.activity_action,
  p_entity_type text,
  p_entity_id uuid default null,
  p_summary text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.activity_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.activity_logs;
begin
  insert into public.activity_logs (actor_id, action, entity_type, entity_id, summary, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_summary, p_metadata)
  returning * into row;
  return row;
end;
$$;

revoke all on function public.log_activity(public.activity_action, text, uuid, text, jsonb) from public;
grant execute on function public.log_activity(public.activity_action, text, uuid, text, jsonb) to authenticated;
grant execute on function public.log_activity(public.activity_action, text, uuid, text, jsonb) to service_role;

create or replace function public.activity_log_on_leads()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity('create', 'lead', new.id, 'Lead created: ' || new.full_name, jsonb_build_object('status', new.status));
  elsif tg_op = 'UPDATE' then
    perform public.log_activity('update', 'lead', new.id, 'Lead updated: ' || new.full_name, jsonb_build_object('status', new.status));
  elsif tg_op = 'DELETE' then
    perform public.log_activity('delete', 'lead', old.id, 'Lead deleted: ' || old.full_name, '{}'::jsonb);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists leads_activity_log on public.leads;
create trigger leads_activity_log
  after insert or update or delete on public.leads
  for each row execute function public.activity_log_on_leads();

create or replace function public.activity_log_on_calls()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity('call', 'call_log', new.id, 'Call logged', jsonb_build_object('status', new.status, 'duration', new.duration_seconds));
  end if;
  return new;
end;
$$;

drop trigger if exists call_logs_activity_log on public.call_logs;
create trigger call_logs_activity_log
  after insert on public.call_logs
  for each row execute function public.activity_log_on_calls();

create or replace function public.activity_log_on_followups()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity('followup', 'followup', new.id, 'Follow-up scheduled: ' || new.title, jsonb_build_object('due_at', new.due_at));
  elsif tg_op = 'UPDATE' and new.status = 'completed' and old.status is distinct from new.status then
    perform public.log_activity('status_change', 'followup', new.id, 'Follow-up completed: ' || new.title, '{}'::jsonb);
  end if;
  return new;
end;
$$;

drop trigger if exists followups_activity_log on public.followups;
create trigger followups_activity_log
  after insert or update on public.followups
  for each row execute function public.activity_log_on_followups();

-- ---------------------------------------------------------------------------
-- 10. SYSTEM SETTINGS
-- ---------------------------------------------------------------------------
create table if not exists public.system_settings (
  id text primary key default 'global',
  crm_enabled boolean not null default true,
  maintenance_title text not null default 'Scheduled maintenance',
  maintenance_message text not null default 'Our CRM is temporarily unavailable while we perform scheduled maintenance. Please check back soon.',
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint system_settings_singleton check (id = 'global')
);

insert into public.system_settings (id, crm_enabled)
values ('global', true)
on conflict (id) do nothing;

drop trigger if exists system_settings_updated_at on public.system_settings;
create trigger system_settings_updated_at
  before update on public.system_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- BACKFILLS
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'full_name', split_part(coalesce(u.email, 'user'), '@', 1)),
  coalesce(nullif(u.raw_user_meta_data->>'role', ''), 'agent')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

insert into public.agents (profile_id)
select id from public.profiles
where role = 'agent'
on conflict (profile_id) do nothing;

-- Initial dashboard snapshot
select public.refresh_dashboard_stats((timezone('utc', now()))::date);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY — enable all tables
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.leads enable row level security;
alter table public.call_logs enable row level security;
alter table public.followups enable row level security;
alter table public.notes enable row level security;
alter table public.reports enable row level security;
alter table public.dashboard_stats enable row level security;
alter table public.activity_logs enable row level security;
alter table public.system_settings enable row level security;

-- ---------------------------------------------------------------------------
-- PROFILES policies
-- ---------------------------------------------------------------------------
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_insert_admin" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "profiles_select_admin"
  on public.profiles for select to authenticated
  using (public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_update_admin"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "profiles_insert_admin"
  on public.profiles for insert to authenticated
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- AGENTS policies
-- ---------------------------------------------------------------------------
drop policy if exists "agents_select_admin" on public.agents;
drop policy if exists "agents_select_own" on public.agents;
drop policy if exists "agents_insert_admin" on public.agents;
drop policy if exists "agents_update_admin" on public.agents;
drop policy if exists "agents_update_own_status" on public.agents;
drop policy if exists "agents_delete_admin" on public.agents;

create policy "agents_select_admin"
  on public.agents for select to authenticated
  using (public.is_admin());

create policy "agents_select_own"
  on public.agents for select to authenticated
  using (profile_id = auth.uid() and deleted_at is null);

create policy "agents_insert_admin"
  on public.agents for insert to authenticated
  with check (public.is_admin());

create policy "agents_update_admin"
  on public.agents for update to authenticated
  using (public.is_admin());

create policy "agents_update_own_status"
  on public.agents for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "agents_delete_admin"
  on public.agents for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- LEADS policies (agents: assigned only; admins: all non-deleted)
-- ---------------------------------------------------------------------------
drop policy if exists "leads_select_admin" on public.leads;
drop policy if exists "leads_select_assigned_agent" on public.leads;
drop policy if exists "leads_select_created_by" on public.leads;
drop policy if exists "leads_insert_authenticated" on public.leads;
drop policy if exists "leads_update_admin" on public.leads;
drop policy if exists "leads_update_assigned_agent" on public.leads;
drop policy if exists "leads_delete_admin" on public.leads;

create policy "leads_select_admin"
  on public.leads for select to authenticated
  using (public.is_admin() and deleted_at is null);

create policy "leads_select_assigned_agent"
  on public.leads for select to authenticated
  using (
    deleted_at is null
    and assigned_agent_id = public.current_agent_id()
  );

create policy "leads_select_created_by"
  on public.leads for select to authenticated
  using (deleted_at is null and created_by = auth.uid());

create policy "leads_insert_authenticated"
  on public.leads for insert to authenticated
  with check (
    auth.uid() is not null
    and (public.is_admin() or public.is_agent())
    and created_by = auth.uid()
  );

create policy "leads_update_admin"
  on public.leads for update to authenticated
  using (public.is_admin());

create policy "leads_update_assigned_agent"
  on public.leads for update to authenticated
  using (assigned_agent_id = public.current_agent_id() and deleted_at is null);

create policy "leads_delete_admin"
  on public.leads for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- CALL_LOGS policies
-- ---------------------------------------------------------------------------
drop policy if exists "call_logs_select_admin" on public.call_logs;
drop policy if exists "call_logs_select_own_agent" on public.call_logs;
drop policy if exists "call_logs_select_lead_access" on public.call_logs;
drop policy if exists "call_logs_insert_authenticated" on public.call_logs;
drop policy if exists "call_logs_update_admin" on public.call_logs;
drop policy if exists "call_logs_update_own_agent" on public.call_logs;
drop policy if exists "call_logs_delete_admin" on public.call_logs;

create policy "call_logs_select_admin"
  on public.call_logs for select to authenticated
  using (public.is_admin() and deleted_at is null);

create policy "call_logs_select_own_agent"
  on public.call_logs for select to authenticated
  using (agent_id = public.current_agent_id() and deleted_at is null);

create policy "call_logs_select_lead_access"
  on public.call_logs for select to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.leads l
      where l.id = call_logs.lead_id
        and l.deleted_at is null
        and (l.assigned_agent_id = public.current_agent_id() or l.created_by = auth.uid())
    )
  );

create policy "call_logs_insert_authenticated"
  on public.call_logs for insert to authenticated
  with check (
    auth.uid() is not null
    and (public.is_admin() or agent_id = public.current_agent_id())
  );

create policy "call_logs_update_admin"
  on public.call_logs for update to authenticated
  using (public.is_admin());

create policy "call_logs_update_own_agent"
  on public.call_logs for update to authenticated
  using (agent_id = public.current_agent_id());

create policy "call_logs_delete_admin"
  on public.call_logs for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- FOLLOWUPS policies
-- ---------------------------------------------------------------------------
drop policy if exists "followups_select_admin" on public.followups;
drop policy if exists "followups_select_assigned" on public.followups;
drop policy if exists "followups_select_lead_access" on public.followups;
drop policy if exists "followups_insert_authenticated" on public.followups;
drop policy if exists "followups_update_admin" on public.followups;
drop policy if exists "followups_update_assigned" on public.followups;
drop policy if exists "followups_delete_admin" on public.followups;

create policy "followups_select_admin"
  on public.followups for select to authenticated
  using (public.is_admin() and deleted_at is null);

create policy "followups_select_assigned"
  on public.followups for select to authenticated
  using (assigned_agent_id = public.current_agent_id() and deleted_at is null);

create policy "followups_select_lead_access"
  on public.followups for select to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.leads l
      where l.id = followups.lead_id
        and l.deleted_at is null
        and l.assigned_agent_id = public.current_agent_id()
    )
  );

create policy "followups_insert_authenticated"
  on public.followups for insert to authenticated
  with check (
    auth.uid() is not null
    and (public.is_admin() or assigned_agent_id = public.current_agent_id())
  );

create policy "followups_update_admin"
  on public.followups for update to authenticated
  using (public.is_admin());

create policy "followups_update_assigned"
  on public.followups for update to authenticated
  using (assigned_agent_id = public.current_agent_id() and deleted_at is null);

create policy "followups_delete_admin"
  on public.followups for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- NOTES policies
-- ---------------------------------------------------------------------------
drop policy if exists "notes_select_admin" on public.notes;
drop policy if exists "notes_select_author" on public.notes;
drop policy if exists "notes_select_lead_access" on public.notes;
drop policy if exists "notes_insert_authenticated" on public.notes;
drop policy if exists "notes_update_author" on public.notes;
drop policy if exists "notes_update_admin" on public.notes;
drop policy if exists "notes_delete_author" on public.notes;
drop policy if exists "notes_delete_admin" on public.notes;

create policy "notes_select_admin"
  on public.notes for select to authenticated
  using (public.is_admin() and deleted_at is null);

create policy "notes_select_author"
  on public.notes for select to authenticated
  using (author_id = auth.uid() and deleted_at is null);

create policy "notes_select_lead_access"
  on public.notes for select to authenticated
  using (
    deleted_at is null
    and lead_id is not null
    and exists (
      select 1 from public.leads l
      where l.id = notes.lead_id
        and l.deleted_at is null
        and (l.assigned_agent_id = public.current_agent_id() or l.created_by = auth.uid())
    )
  );

create policy "notes_insert_authenticated"
  on public.notes for insert to authenticated
  with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and (public.is_admin() or public.is_agent())
  );

create policy "notes_update_author"
  on public.notes for update to authenticated
  using (author_id = auth.uid());

create policy "notes_update_admin"
  on public.notes for update to authenticated
  using (public.is_admin());

create policy "notes_delete_author"
  on public.notes for delete to authenticated
  using (author_id = auth.uid());

create policy "notes_delete_admin"
  on public.notes for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- REPORTS policies (admin full; agents read own scope)
-- ---------------------------------------------------------------------------
drop policy if exists "reports_select_admin" on public.reports;
drop policy if exists "reports_select_agent_own" on public.reports;
drop policy if exists "reports_insert_admin" on public.reports;
drop policy if exists "reports_update_admin" on public.reports;
drop policy if exists "reports_delete_admin" on public.reports;

create policy "reports_select_admin"
  on public.reports for select to authenticated
  using (public.is_admin());

create policy "reports_select_agent_own"
  on public.reports for select to authenticated
  using (
    public.is_agent()
    and scope = 'agent'
    and agent_id = public.current_agent_id()
  );

create policy "reports_insert_admin"
  on public.reports for insert to authenticated
  with check (public.is_admin());

create policy "reports_update_admin"
  on public.reports for update to authenticated
  using (public.is_admin());

create policy "reports_delete_admin"
  on public.reports for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- DASHBOARD_STATS policies
-- ---------------------------------------------------------------------------
drop policy if exists "dashboard_stats_select_admin" on public.dashboard_stats;
drop policy if exists "dashboard_stats_select_agent_own" on public.dashboard_stats;
drop policy if exists "dashboard_stats_insert_admin" on public.dashboard_stats;
drop policy if exists "dashboard_stats_update_admin" on public.dashboard_stats;

create policy "dashboard_stats_select_admin"
  on public.dashboard_stats for select to authenticated
  using (public.is_admin());

create policy "dashboard_stats_select_agent_own"
  on public.dashboard_stats for select to authenticated
  using (
    public.is_agent()
    and scope = 'agent'
    and agent_id = public.current_agent_id()
  );

create policy "dashboard_stats_select_global_authenticated"
  on public.dashboard_stats for select to authenticated
  using (scope = 'global');

create policy "dashboard_stats_insert_admin"
  on public.dashboard_stats for insert to authenticated
  with check (public.is_admin());

create policy "dashboard_stats_update_admin"
  on public.dashboard_stats for update to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- ACTIVITY_LOGS policies
-- ---------------------------------------------------------------------------
drop policy if exists "activity_logs_select_admin" on public.activity_logs;
drop policy if exists "activity_logs_select_own" on public.activity_logs;
drop policy if exists "activity_logs_insert_authenticated" on public.activity_logs;

create policy "activity_logs_select_admin"
  on public.activity_logs for select to authenticated
  using (public.is_admin());

create policy "activity_logs_select_own"
  on public.activity_logs for select to authenticated
  using (actor_id = auth.uid());

create policy "activity_logs_insert_authenticated"
  on public.activity_logs for insert to authenticated
  with check (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- SYSTEM_SETTINGS policies
-- ---------------------------------------------------------------------------
drop policy if exists "system_settings_public_read" on public.system_settings;
drop policy if exists "system_settings_admin_update" on public.system_settings;

create policy "system_settings_public_read"
  on public.system_settings for select
  to anon, authenticated
  using (true);

create policy "system_settings_admin_update"
  on public.system_settings for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- ANALYTICS VIEWS
-- ---------------------------------------------------------------------------
create or replace view public.lead_stats
with (security_invoker = true)
as
select
  count(*)::bigint as total_leads,
  count(*) filter (where status = 'converted')::bigint as converted_leads,
  count(*) filter (where status not in ('converted', 'closed', 'not_interested'))::bigint as active_leads,
  count(*) filter (where next_follow_up_at is not null and next_follow_up_at > timezone('utc', now()))::bigint as upcoming_followups
from public.leads
where deleted_at is null;

create or replace view public.agent_performance_view
with (security_invoker = true)
as
select
  a.id as agent_id,
  p.full_name as agent_name,
  p.email as agent_email,
  a.department,
  a.status as presence_status,
  a.is_active,
  a.calls_handled,
  a.avg_handle_time_seconds,
  a.satisfaction_score,
  count(distinct l.id) filter (where l.deleted_at is null) as assigned_leads,
  count(distinct l.id) filter (where l.status = 'converted' and l.deleted_at is null) as converted_leads,
  count(distinct f.id) filter (where f.status in ('pending', 'in_progress') and f.deleted_at is null) as pending_followups
from public.agents a
join public.profiles p on p.id = a.profile_id
left join public.leads l on l.assigned_agent_id = a.id
left join public.followups f on f.assigned_agent_id = a.id
where a.deleted_at is null
group by a.id, p.full_name, p.email, a.department, a.status, a.is_active, a.calls_handled, a.avg_handle_time_seconds, a.satisfaction_score;

create or replace view public.daily_call_stats
with (security_invoker = true)
as
select
  (started_at at time zone 'utc')::date as call_date,
  count(*)::bigint as total_calls,
  count(*) filter (where status = 'connected')::bigint as connected_calls,
  coalesce(sum(duration_seconds), 0)::bigint as total_duration_seconds,
  coalesce(avg(duration_seconds), 0)::numeric(10, 2) as avg_duration_seconds
from public.call_logs
where deleted_at is null
group by (started_at at time zone 'utc')::date
order by call_date desc;

-- ---------------------------------------------------------------------------
-- REALTIME (optional)
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.system_settings;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant execute on all functions in schema public to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- COMMENTS
-- ---------------------------------------------------------------------------
comment on table public.profiles is 'CRM user profiles linked to auth.users (admin | agent)';
comment on table public.agents is 'Call center agents (1:1 with agent profiles)';
comment on table public.leads is 'Lead / prospect pipeline';
comment on table public.notes is 'Polymorphic notes (leads, calls, follow-ups); see lead_notes view';
comment on table public.call_logs is 'Inbound/outbound call history';
comment on table public.followups is 'Scheduled follow-up tasks; see follow_ups view';
comment on table public.reports is 'Persisted report snapshots (daily, performance, conversion)';
comment on table public.dashboard_stats is 'Dashboard KPI counters by date and scope';
comment on table public.activity_logs is 'Audit trail for CRM actions';
comment on table public.system_settings is 'Global CRM maintenance / enable flag (singleton)';

commit;

-- =============================================================================
-- POST-DEPLOY: promote first admin (replace email)
-- =============================================================================
-- update public.profiles set role = 'admin' where email = 'admin@yourcompany.com';
