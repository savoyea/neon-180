-- ============================================================================
-- Dart-180 — Correctif RLS : récursion infinie entre games / game_players
-- (erreur 42P17). À exécuter dans Supabase → SQL Editor.
-- Les politiques se référençaient mutuellement ; on casse le cycle avec des
-- fonctions SECURITY DEFINER qui contournent la RLS lors de la vérification.
-- ============================================================================

create or replace function public.is_game_participant(gid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.game_players where game_id = gid and player_id = auth.uid());
$$;

create or replace function public.is_game_owner(gid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.games where id = gid and created_by = auth.uid());
$$;

-- ---- games ----
drop policy if exists "games visible to participants" on public.games;
create policy "games visible to participants" on public.games
  for select using (created_by = auth.uid() or public.is_game_participant(id));

drop policy if exists "games insert by creator" on public.games;
create policy "games insert by creator" on public.games
  for insert with check (created_by = auth.uid());

-- ---- game_players ----
drop policy if exists "game_players visible" on public.game_players;
create policy "game_players visible" on public.game_players
  for select using (player_id = auth.uid() or public.is_game_owner(game_id));

drop policy if exists "game_players insert" on public.game_players;
create policy "game_players insert" on public.game_players
  for insert with check (public.is_game_owner(game_id));
