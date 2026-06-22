-- ============================================================================
-- Dart-180 — Persistance de TOUTES les parties (locales + en ligne) en base
-- À exécuter dans Supabase → SQL Editor (ou via psql).
-- ============================================================================

alter table public.games add column if not exists record   jsonb;
alter table public.games add column if not exists played_at timestamptz not null default now();
create index if not exists games_creator_idx on public.games (created_by, played_at desc);

-- Enregistre une partie pour le joueur connecté (s'il y a participé).
-- p_update_stats=true : met à jour ses stats (parties locales). En ligne, les
-- stats passent par apply_match_result, on appelle alors avec false.
create or replace function public.log_game(p_record jsonb, p_update_stats boolean default false, p_online boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); mine jsonb; pl jsonb; is_win boolean; s180 int; bestco int; add_xp int;
        the_mode text; the_winner text; gid uuid;
begin
  if me is null then return null; end if;
  the_mode := p_record->>'mode';
  the_winner := p_record->>'winner';
  for pl in select * from jsonb_array_elements(p_record->'players') loop
    if (pl->>'id') = me::text then mine := pl; end if;
  end loop;
  if mine is null then return null; end if; -- le joueur connecté n'a pas participé

  insert into public.games (created_by, mode, variant, is_online, winner_id, record, played_at, status)
    values (me, the_mode, p_record->>'variant', p_online,
            case when the_winner = me::text then me else null end,
            p_record, now(), 'finished')
    returning id into gid;

  if p_update_stats then
    is_win := (the_winner = me::text);
    s180 := coalesce((mine->>'s180')::int, 0);
    bestco := coalesce((mine->>'bestCheckout')::int, 0);
    add_xp := (case when is_win then 100 else 25 end) + s180 * 20;
    update public.profiles set
      games_played  = games_played + 1,
      wins          = wins + (case when is_win then 1 else 0 end),
      total_180     = total_180 + s180,
      best_checkout = greatest(best_checkout, bestco),
      win_streak    = (case when is_win then win_streak + 1 else 0 end),
      best_streak   = greatest(best_streak, (case when is_win then win_streak + 1 else 0 end)),
      xp            = xp + add_xp,
      level         = greatest(1, floor((xp + add_xp) / 1000.0)::int + 1),
      mode_wins     = case when is_win then coalesce(mode_wins, '{}'::jsonb) || jsonb_build_object(the_mode, coalesce((mode_wins->>the_mode)::int, 0) + 1) else mode_wins end
    where id = me;
  end if;
  return gid;
end; $$;

grant execute on function public.log_game(jsonb, boolean, boolean) to authenticated;
