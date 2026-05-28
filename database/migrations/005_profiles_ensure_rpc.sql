-- Profiles: backfill existing auth users + RPC to ensure profile on login (no service role required)
-- Run after 001_profiles.sql

-- Backfill profiles for users created in Supabase Auth before migrations/triggers existed
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'full_name', split_part(coalesce(u.email, 'user'), '@', 1)),
  coalesce(
    nullif(u.raw_user_meta_data->>'role', ''),
    'agent'
  )
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- Idempotent signup trigger (safe if profile already exists)
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

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    assigned_role
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

-- Ensures public.profiles row for the current auth session (called after login)
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
  from auth.users
  where id = uid;

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
  on conflict (id) do update
    set email = excluded.email
  returning * into created;

  return created;
end;
$$;

revoke all on function public.ensure_current_user_profile(text) from public;
grant execute on function public.ensure_current_user_profile(text) to authenticated;
grant execute on function public.ensure_current_user_profile(text) to service_role;
