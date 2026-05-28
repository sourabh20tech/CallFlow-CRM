-- Lead status pipeline v2 + next follow-up date on leads

create type public.lead_status_new as enum (
  'new',
  'interested',
  'follow_up',
  'converted',
  'not_interested',
  'closed'
);

alter table public.leads
  alter column status drop default;

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

alter table public.leads
  alter column status set default 'new'::public.lead_status;

alter table public.leads
  add column if not exists next_follow_up_at timestamptz;

create index if not exists leads_next_follow_up_idx on public.leads (next_follow_up_at);
