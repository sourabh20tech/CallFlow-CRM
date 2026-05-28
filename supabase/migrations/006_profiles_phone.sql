-- Add phone to agent/admin profiles for CRM contact info

alter table public.profiles
  add column if not exists phone text;

comment on column public.profiles.phone is 'Contact phone number for CRM users (agents/admins)';
