-- Global CRM system configuration (singleton row)
-- Requires: 001_profiles.sql (is_admin, set_updated_at)

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

create trigger system_settings_updated_at
  before update on public.system_settings
  for each row execute function public.set_updated_at();

alter table public.system_settings enable row level security;

-- Public read — required for edge middleware, login page, and status hooks
create policy "system_settings_public_read"
  on public.system_settings
  for select
  to anon, authenticated
  using (true);

create policy "system_settings_admin_update"
  on public.system_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Realtime for live status updates
alter publication supabase_realtime add table public.system_settings;
