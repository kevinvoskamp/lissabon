-- Gedeelde sterren voor de Wensen-lijst.
-- Draai dit in het Supabase-dashboard onder: SQL Editor -> New query -> Run.

create table if not exists public.wensen_ratings (
  person     text        not null,
  activity   text        not null,
  stars      smallint    not null check (stars between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (person, activity)
);

-- Row Level Security aan. Dit is een familie-app zonder echte accounts: de
-- toegang wordt geregeld door het gedeelde wachtwoord in de app, niet door
-- Supabase-auth. We geven de publieke (anon) key daarom lees- en schrijfrechten
-- op ALLEEN deze tabel. Er staat geen gevoelige data in (alleen namen + sterren).
alter table public.wensen_ratings enable row level security;

drop policy if exists "wensen_ratings anon read"   on public.wensen_ratings;
drop policy if exists "wensen_ratings anon write"  on public.wensen_ratings;
drop policy if exists "wensen_ratings anon update" on public.wensen_ratings;
drop policy if exists "wensen_ratings anon delete" on public.wensen_ratings;

create policy "wensen_ratings anon read"   on public.wensen_ratings for select using (true);
create policy "wensen_ratings anon write"  on public.wensen_ratings for insert with check (true);
create policy "wensen_ratings anon update" on public.wensen_ratings for update using (true) with check (true);
create policy "wensen_ratings anon delete" on public.wensen_ratings for delete using (true);

-- Realtime: zorg dat wijzigingen live naar alle telefoons worden gepusht.
-- (Negeer een fout hier als de tabel al aan de publicatie is toegevoegd.)
alter publication supabase_realtime add table public.wensen_ratings;
