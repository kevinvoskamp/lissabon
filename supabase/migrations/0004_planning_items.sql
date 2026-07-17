-- Gedeelde planning: alle dag-items en de lijst "nog in te plannen".
-- day_idx 0..7 = de acht reisdagen, day_idx -1 = nog in te plannen.
-- Draai dit in het Supabase-dashboard: SQL Editor -> New query -> Run.

create table if not exists public.planning_items (
  id         text        primary key,
  day_idx    smallint    not null,
  pos        integer     not null default 0,
  title      text        not null,
  cat        text        not null,
  dur        text        not null default '',
  note       text        not null default '',
  done       boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table public.planning_items enable row level security;

drop policy if exists "planning_items anon all" on public.planning_items;
create policy "planning_items anon all" on public.planning_items for all using (true) with check (true);

alter publication supabase_realtime add table public.planning_items;
