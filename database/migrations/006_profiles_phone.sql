-- Add phone to agent/admin profiles for CRM contact info

alter table public.profiles
  add column if not exists phone text;

comment on column public.profiles.phone is 'Contact phone number for CRM users (agents/admins)';

-- Optional: case-insensitive unique email (skip if duplicates already exist in your project)
-- create unique index if not exists profiles_email_lower_unique_idx
--   on public.profiles (lower(trim(email)));
