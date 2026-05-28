-- Call disposition statuses (replaces legacy queued/active/completed/missed/voicemail)
-- Requires: 002_crm_schema.sql

create type public.call_status_new as enum (
  'connected',
  'busy',
  'no_answer',
  'callback',
  'interested',
  'not_interested'
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

alter table public.call_logs
  alter column status set default 'callback'::public.call_status;

comment on type public.call_status is 'Call disposition: connected, busy, no_answer, callback, interested, not_interested';
