-- Align Follow-Ups physical table name with app queries.
-- Target table name: public.follow_ups

do $$
begin
  if to_regclass('public.follow_ups') is null and to_regclass('public.followups') is not null then
    execute 'alter table public.followups rename to follow_ups';
  end if;
end $$;

-- Keep backwards-compatible view for older SQL/functions.
create or replace view public.followups as
select * from public.follow_ups;

notify pgrst, 'reload schema';
