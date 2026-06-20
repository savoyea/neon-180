-- ============================================================================
-- Dart-180 — Schéma Supabase (Phase 1 : socle comptes + profils)
-- À exécuter dans Supabase Studio → SQL Editor.
-- ============================================================================

-- ---------- PROFILS JOUEURS -------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  level        int  not null default 1,
  xp           int  not null default 0,
  is_premium   boolean not null default false,
  avatar_seed  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Tout le monde (authentifié) peut lire les profils (classements, amis…)
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles
  for select using (true);

-- Chacun ne modifie que son propre profil
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
  for insert with check (auth.uid() = id);

-- Création automatique du profil à l'inscription (pseudo passé en metadata)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Joueur-' || left(new.id::text, 6))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- PARTIES (groundwork pour la phase 2) ----------------------------
create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  mode        text not null,                 -- x01 | cricket | atw | killer | countup | bar
  variant     text,                          -- ex : '501'
  options     jsonb not null default '{}',
  status      text not null default 'finished', -- ongoing | finished | abandoned
  is_online   boolean not null default false,
  winner_id   uuid references public.profiles(id) on delete set null,
  created_by  uuid references public.profiles(id) on delete set null,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);

create table if not exists public.game_players (
  game_id     uuid references public.games(id) on delete cascade,
  player_id   uuid references public.profiles(id) on delete cascade,
  seat        int not null default 0,
  result      text,                          -- win | loss
  stats       jsonb not null default '{}',   -- moyenne, 180, finish, marques…
  primary key (game_id, player_id)
);

alter table public.games enable row level security;
alter table public.game_players enable row level security;

-- Fonctions SECURITY DEFINER : contournent la RLS pour éviter la récursion
-- infinie entre les politiques de games et game_players (erreur 42P17).
create or replace function public.is_game_participant(gid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.game_players where game_id = gid and player_id = auth.uid());
$$;

create or replace function public.is_game_owner(gid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.games where id = gid and created_by = auth.uid());
$$;

-- Un joueur voit les parties auxquelles il a participé (ou qu'il a créées)
drop policy if exists "games visible to participants" on public.games;
create policy "games visible to participants" on public.games
  for select using (created_by = auth.uid() or public.is_game_participant(id));

drop policy if exists "games insert by creator" on public.games;
create policy "games insert by creator" on public.games
  for insert with check (created_by = auth.uid());

drop policy if exists "game_players visible" on public.game_players;
create policy "game_players visible" on public.game_players
  for select using (player_id = auth.uid() or public.is_game_owner(game_id));

drop policy if exists "game_players insert" on public.game_players;
create policy "game_players insert" on public.game_players
  for insert with check (public.is_game_owner(game_id));
