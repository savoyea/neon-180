-- ============================================================================
-- Dart-180 — Phase 6 : gamification (séries de victoires pour les badges)
-- À exécuter dans Supabase → SQL Editor (ou via psql).
-- ============================================================================

alter table public.profiles add column if not exists win_streak  int not null default 0;
alter table public.profiles add column if not exists best_streak int not null default 0;

-- Mise à jour du RPC pour entretenir la série de victoires.
create or replace function public.apply_match_result(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m record; pl jsonb; pid uuid; is_win boolean; s180 int; bestco int; add_xp int; new_streak int;
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
      win_streak    = (case when is_win then win_streak + 1 else 0 end),
      best_streak   = greatest(best_streak, (case when is_win then win_streak + 1 else 0 end)),
      xp            = xp + add_xp,
      level         = greatest(1, floor((xp + add_xp) / 1000.0)::int + 1)
    where id = pid;
  end loop;
end; $$;
