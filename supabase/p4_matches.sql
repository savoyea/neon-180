-- ============================================================================
-- Dart-180 — Phase 4 : multijoueur temps réel (parties à distance + chat)
-- À exécuter dans Supabase → SQL Editor (ou via psql).
-- ============================================================================

-- ---------- MATCHS EN LIGNE -------------------------------------------------
create table if not exists public.matches (
  id             uuid primary key default gen_random_uuid(),
  host_id        uuid not null references public.profiles(id) on delete cascade,
  guest_id       uuid not null references public.profiles(id) on delete cascade,
  mode           text not null,
  options        jsonb not null default '{}',
  state          jsonb,                                  -- état complet du moteur de jeu
  status         text not null default 'invited',        -- invited|active|finished|declined|cancelled
  turn_player_id uuid references public.profiles(id),    -- à qui de jouer
  winner_id      uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists matches_guest_idx on public.matches (guest_id, status);
create index if not exists matches_host_idx  on public.matches (host_id, status);

alter table public.matches enable row level security;
alter table public.matches replica identity full;

create or replace function public.is_match_participant(mid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.matches
    where id = mid and (host_id = auth.uid() or guest_id = auth.uid()));
$$;

drop policy if exists "matches visible to players" on public.matches;
create policy "matches visible to players" on public.matches
  for select using (host_id = auth.uid() or guest_id = auth.uid());

drop policy if exists "matches insert by host" on public.matches;
create policy "matches insert by host" on public.matches
  for insert with check (host_id = auth.uid());

drop policy if exists "matches update by players" on public.matches;
create policy "matches update by players" on public.matches
  for update using (host_id = auth.uid() or guest_id = auth.uid());

drop policy if exists "matches delete by host" on public.matches;
create policy "matches delete by host" on public.matches
  for delete using (host_id = auth.uid());

-- ---------- CHAT DE MATCH ---------------------------------------------------
create table if not exists public.match_messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists match_messages_match_idx on public.match_messages (match_id, created_at);

alter table public.match_messages enable row level security;
alter table public.match_messages replica identity full;

drop policy if exists "match_messages visible to players" on public.match_messages;
create policy "match_messages visible to players" on public.match_messages
  for select using (public.is_match_participant(match_id));

drop policy if exists "match_messages insert by participant" on public.match_messages;
create policy "match_messages insert by participant" on public.match_messages
  for insert with check (sender_id = auth.uid() and public.is_match_participant(match_id));

-- ---------- REALTIME --------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='matches') then
    alter publication supabase_realtime add table public.matches;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='match_messages') then
    alter publication supabase_realtime add table public.match_messages;
  end if;
end $$;
