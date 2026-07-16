-- Eigen wensen en eigen gegevens (Docs/Gegevens), gedeeld met het hele gezin.
-- Draai dit in het Supabase-dashboard: SQL Editor -> New query -> Run.

-- Zelf toegevoegde wensen; iedereen kan er sterren voor geven.
create table if not exists public.wensen_items (
  id         text        primary key,
  title      text        not null,
  cat        text        not null,
  dur        text        not null default '',
  note       text        not null default '',
  created_by text        not null default '',
  created_at timestamptz not null default now()
);

-- Zelf toegevoegde gegevens: taxi, hotelreservering, enzovoort.
create table if not exists public.info_items (
  id         text        primary key,
  title      text        not null,
  body       text        not null default '',
  created_by text        not null default '',
  created_at timestamptz not null default now()
);

alter table public.wensen_items enable row level security;
alter table public.info_items  enable row level security;

drop policy if exists "wensen_items anon all" on public.wensen_items;
drop policy if exists "info_items anon all"   on public.info_items;

create policy "wensen_items anon all" on public.wensen_items for all using (true) with check (true);
create policy "info_items anon all"   on public.info_items   for all using (true) with check (true);

alter publication supabase_realtime add table public.wensen_items;
alter publication supabase_realtime add table public.info_items;
