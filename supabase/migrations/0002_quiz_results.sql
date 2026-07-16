-- Quiz-uitslagen per persoon per dag (voor de dagranglijst).
-- Draai dit in het Supabase-dashboard: SQL Editor -> New query -> Run.

create table if not exists public.quiz_results (
  person     text        not null,
  quiz_day   date        not null,
  score      smallint    not null,
  seconds    integer     not null,
  created_at timestamptz not null default now(),
  primary key (person, quiz_day)
);

alter table public.quiz_results enable row level security;

drop policy if exists "quiz_results anon read"   on public.quiz_results;
drop policy if exists "quiz_results anon write"  on public.quiz_results;
drop policy if exists "quiz_results anon update" on public.quiz_results;

create policy "quiz_results anon read"   on public.quiz_results for select using (true);
create policy "quiz_results anon write"  on public.quiz_results for insert with check (true);
create policy "quiz_results anon update" on public.quiz_results for update using (true) with check (true);

alter publication supabase_realtime add table public.quiz_results;
