-- Lead notes table alignment (idempotent)
-- Production schema uses public.lead_notes (not public.notes).

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  is_pinned boolean not null default false,
  call_log_id uuid references public.call_logs (id) on delete set null,
  followup_id uuid references public.follow_ups (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.lead_notes
  add column if not exists lead_id uuid references public.leads (id) on delete cascade,
  add column if not exists author_id uuid references public.profiles (id) on delete cascade,
  add column if not exists content text,
  add column if not exists is_pinned boolean not null default false,
  add column if not exists call_log_id uuid references public.call_logs (id) on delete set null,
  add column if not exists followup_id uuid references public.follow_ups (id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists lead_notes_lead_id_idx on public.lead_notes (lead_id);
create index if not exists lead_notes_call_log_id_idx on public.lead_notes (call_log_id);
create index if not exists lead_notes_followup_id_idx on public.lead_notes (followup_id);
create index if not exists lead_notes_author_id_idx on public.lead_notes (author_id);
create index if not exists lead_notes_created_at_idx on public.lead_notes (created_at desc);
create index if not exists lead_notes_not_deleted_idx
  on public.lead_notes (id) where deleted_at is null;

drop trigger if exists lead_notes_updated_at on public.lead_notes;
create trigger lead_notes_updated_at
  before update on public.lead_notes
  for each row execute function public.set_updated_at();

alter table public.lead_notes enable row level security;

drop policy if exists "lead_notes_select_admin" on public.lead_notes;
drop policy if exists "lead_notes_select_author" on public.lead_notes;
drop policy if exists "lead_notes_select_lead_access" on public.lead_notes;
drop policy if exists "lead_notes_insert_authenticated" on public.lead_notes;
drop policy if exists "lead_notes_update_author" on public.lead_notes;
drop policy if exists "lead_notes_update_admin" on public.lead_notes;
drop policy if exists "lead_notes_delete_author" on public.lead_notes;
drop policy if exists "lead_notes_delete_admin" on public.lead_notes;

create policy "lead_notes_select_admin"
  on public.lead_notes for select
  using (public.is_admin());

create policy "lead_notes_select_author"
  on public.lead_notes for select
  using (author_id = auth.uid());

create policy "lead_notes_select_lead_access"
  on public.lead_notes for select
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_notes.lead_id
        and (
          l.assigned_agent_id = public.current_agent_id()
          or l.created_by = auth.uid()
        )
    )
  );

create policy "lead_notes_insert_authenticated"
  on public.lead_notes for insert
  with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and (public.is_admin() or public.is_agent())
  );

create policy "lead_notes_update_author"
  on public.lead_notes for update
  using (author_id = auth.uid());

create policy "lead_notes_update_admin"
  on public.lead_notes for update
  using (public.is_admin());

create policy "lead_notes_delete_author"
  on public.lead_notes for delete
  using (author_id = auth.uid());

create policy "lead_notes_delete_admin"
  on public.lead_notes for delete
  using (public.is_admin());

notify pgrst, 'reload schema';
