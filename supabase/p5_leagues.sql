-- ============================================================================
-- Dart-180 — Phase 5 : ligues & classements
-- À exécuter dans Supabase → SQL Editor (ou via psql).
-- ============================================================================

-- ---------- STATS AGRÉGÉES SUR LES PROFILS ----------------------------------
alter table public.profiles add column if not exists games_played  int not null default 0;
alter table public.profiles add column if not exists wins          int not null default 0;
alter table public.profiles add column if not exists total_180     int not null default 0;
alter table public.profiles add column if not exists best_checkout int not null default 0;

alter table public.matches add column if not exists rated boolean not null default false;

-- ---------- LIGUES ----------------------------------------------------------
create table if not exists public.leagues (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  emoji        text not null default '🎯',
  description  text,
  celebration  text,                         -- phrase affichée chez l'adversaire qui perd
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  is_open      boolean not null default true, -- accepte les demandes d'accès
  created_at   timestamptz not null default now()
);

create table if not exists public.league_members (
  league_id  uuid not null references public.leagues(id) on delete cascade,
  player_id  uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'member', -- owner | member
  status     text not null default 'active', -- active | pending
  joined_at  timestamptz not null default now(),
  primary key (league_id, player_id)
);
create index if not exists league_members_player_idx on public.league_members (player_id);

alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

create or replace function public.is_league_owner(lid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.leagues where id = lid and owner_id = auth.uid());
$$;

-- leagues : découverte publique, gestion par le propriétaire
drop policy if exists "leagues readable" on public.leagues;
create policy "leagues readable" on public.leagues for select using (true);
drop policy if exists "leagues insert" on public.leagues;
create policy "leagues insert" on public.leagues for insert with check (owner_id = auth.uid());
drop policy if exists "leagues owner update" on public.leagues;
create policy "leagues owner update" on public.leagues for update using (owner_id = auth.uid());
drop policy if exists "leagues owner delete" on public.leagues;
create policy "leagues owner delete" on public.leagues for delete using (owner_id = auth.uid());

-- league_members : listes publiques ; on s'inscrit soi-même, l'owner gère
drop policy if exists "members readable" on public.league_members;
create policy "members readable" on public.league_members for select using (true);
drop policy if exists "members self insert" on public.league_members;
create policy "members self insert" on public.league_members for insert with check (player_id = auth.uid());
drop policy if exists "members owner update" on public.league_members;
create policy "members owner update" on public.league_members for update using (public.is_league_owner(league_id));
drop policy if exists "members leave or kick" on public.league_members;
create policy "members leave or kick" on public.league_members for delete
  using (player_id = auth.uid() or public.is_league_owner(league_id));

-- ---------- RPC : créer une ligue (ligue + adhésion owner, atomique) --------
create or replace function public.create_league(p_name text, p_emoji text, p_description text, p_celebration text)
returns uuid language plpgsql security definer set search_path = public as $$
declare lid uuid;
begin
  insert into public.leagues (name, emoji, description, celebration, owner_id)
  values (p_name, coalesce(nullif(p_emoji, ''), '🎯'), p_description, p_celebration, auth.uid())
  returning id into lid;
  insert into public.league_members (league_id, player_id, role, status)
  values (lid, auth.uid(), 'owner', 'active');
  return lid;
end; $$;

-- ---------- RPC : appliquer le résultat d'un match aux stats + XP -----------
-- Idempotent grâce au flag matches.rated (premier appel seulement).
create or replace function public.apply_match_result(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m record; pl jsonb; pid uuid; is_win boolean; s180 int; bestco int; add_xp int;
begin
  update public.matches set rated = true
    where id = p_match and status = 'finished' and rated = false
    returning * into m;
  if not found then return; end if;
  for pl in select * from jsonb_array_elements(m.state->'players') loop
    pid := (pl->>'id')::uuid;
    is_win := (pid = m.winner_id);
    s180 := coalesce((pl->>'s180')::int, 0);
    bestco := coalesce((pl->>'bestCheckout')::int, 0);
    add_xp := (case when is_win then 100 else 25 end) + s180 * 20;
    update public.profiles set
      games_played  = games_played + 1,
      wins          = wins + (case when is_win then 1 else 0 end),
      total_180     = total_180 + s180,
      best_checkout = greatest(best_checkout, bestco),
      xp            = xp + add_xp,
      level         = greatest(1, floor((xp + add_xp) / 1000.0)::int + 1)
    where id = pid;
  end loop;
end; $$;

grant execute on function public.create_league(text, text, text, text) to authenticated;
grant execute on function public.apply_match_result(uuid) to authenticated;
