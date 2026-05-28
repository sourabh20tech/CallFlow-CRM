-- Add lightweight admin announcement fields to system settings singleton.
alter table if exists public.system_settings
  add column if not exists admin_announcement_title text,
  add column if not exists admin_announcement_message text;

notify pgrst, 'reload schema';
