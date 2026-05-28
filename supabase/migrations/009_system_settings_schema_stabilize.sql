-- System Settings schema stabilization (idempotent)
-- Aligns columns expected by Settings UI/API and prevents missing-column runtime failures.

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique,
  crm_enabled boolean not null default true,
  maintenance_mode boolean not null default false,
  maintenance_title text not null default 'Scheduled maintenance',
  maintenance_message text not null default 'Our CRM is temporarily unavailable while we perform scheduled maintenance. Please check back soon.',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.system_settings
  add column if not exists setting_key text,
  add column if not exists crm_enabled boolean not null default true,
  add column if not exists maintenance_mode boolean not null default false,
  add column if not exists maintenance_title text not null default 'Scheduled maintenance',
  add column if not exists maintenance_message text not null default 'Our CRM is temporarily unavailable while we perform scheduled maintenance. Please check back soon.',
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_by uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'system_settings_updated_by_fkey'
  ) then
    alter table public.system_settings
      add constraint system_settings_updated_by_fkey
      foreign key (updated_by) references public.profiles(id) on delete set null;
  end if;
end $$;

update public.system_settings
set setting_key = 'global'
where setting_key is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'system_settings_setting_key_key'
  ) then
    alter table public.system_settings
      add constraint system_settings_setting_key_key unique (setting_key);
  end if;
end $$;

create or replace function public.sync_system_settings_flags()
returns trigger
language plpgsql
as $$
begin
  if NEW.crm_enabled is null and NEW.maintenance_mode is not null then
    NEW.crm_enabled := not NEW.maintenance_mode;
  elsif NEW.maintenance_mode is null and NEW.crm_enabled is not null then
    NEW.maintenance_mode := not NEW.crm_enabled;
  else
    NEW.maintenance_mode := not NEW.crm_enabled;
  end if;
  return NEW;
end;
$$;

drop trigger if exists system_settings_sync_flags on public.system_settings;
create trigger system_settings_sync_flags
before insert or update on public.system_settings
for each row execute function public.sync_system_settings_flags();

insert into public.system_settings (
  setting_key,
  crm_enabled,
  maintenance_mode,
  maintenance_title,
  maintenance_message
)
values (
  'global',
  true,
  false,
  'Scheduled maintenance',
  'Our CRM is temporarily unavailable while we perform scheduled maintenance. Please check back soon.'
)
on conflict (setting_key) do update
set
  crm_enabled = coalesce(public.system_settings.crm_enabled, excluded.crm_enabled),
  maintenance_mode = coalesce(public.system_settings.maintenance_mode, excluded.maintenance_mode),
  maintenance_title = coalesce(nullif(public.system_settings.maintenance_title, ''), excluded.maintenance_title),
  maintenance_message = coalesce(nullif(public.system_settings.maintenance_message, ''), excluded.maintenance_message);

notify pgrst, 'reload schema';
