-- ============================================================================
-- Dart-180 — Mode classé (ELO) + classements par mode
-- À exécuter dans Supabase → SQL Editor (ou via psql).
-- ============================================================================

alter table public.profiles add column if not exists elo int not null default 1000;
alter table public.profiles add column if not exists mode_wins jsonb not null default '{}';
alter table public.matches add column if not exists ranked boolean not null default false;

-- ---------- FILE DE MATCHMAKING --------------------------------------------
create table if not exists public.ranked_queue (
  player_id  uuid primary key references public.profiles(id) on delete cascade,
  elo        int not null default 1000,
  joined_at  timestamptz not null default now()
);
alter table public.ranked_queue enable row level security;
drop policy if exists "queue self" on public.ranked_queue;
create policy "queue self" on public.ranked_queue
  for all using (player_id = auth.uid()) with check (player_id = auth.uid());

-- ---------- apply_match_result : + victoires par mode + ELO ----------------
create or replace function public.apply_match_result(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m record; pl jsonb; pid uuid; is_win boolean; s180 int; bestco int; add_xp int;
        p1 uuid; p2 uuid; e1 int; e2 int; exp1 numeric; s1 int;
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

  -- Victoires par mode (classement par jeu)
  if m.winner_id is not null then
    update public.profiles
      set mode_wins = coalesce(mode_wins, '{}'::jsonb) || jsonb_build_object(m.mode, coalesce((mode_wins->>m.mode)::int, 0) + 1)
      where id = m.winner_id;
  end if;

  -- ELO (parties classées, 2 joueurs)
  if m.ranked then
    p1 := (m.state->'players'->0->>'id')::uuid;
    p2 := (m.state->'players'->1->>'id')::uuid;
    if p1 is not null and p2 is not null then
      select elo into e1 from public.profiles where id = p1;
      select elo into e2 from public.profiles where id = p2;
      exp1 := 1.0 / (1 + power(10, (e2 - e1) / 400.0));
      s1 := case when m.winner_id = p1 then 1 else 0 end;
      update public.profiles set elo = greatest(100, round(e1 + 32 * (s1 - exp1))::int) where id = p1;
      update public.profiles set elo = greatest(100, round(e2 + 32 * ((1 - s1) - (1 - exp1)))::int) where id = p2;
    end if;
  end if;
end; $$;

-- ---------- Matchmaking : trouve un adversaire ou rejoint la file ----------
create or replace function public.find_ranked_match()
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); my_elo int; opp uuid; mid uuid;
begin
  if me is null then return null; end if;
  select elo into my_elo from public.profiles where id = me;
  select player_id into opp from public.ranked_queue
    where player_id <> me order by abs(elo - my_elo), joined_at limit 1;
  if opp is not null then
    delete from public.ranked_queue where player_id in (me, opp);
    insert into public.matches (host_id, guest_id, mode, options, ranked, status)
      values (opp, me, 'x01', '{"start":501,"doubleOut":true,"doubleIn":false,"legs":1}'::jsonb, true, 'invited')
      returning id into mid;
    return mid;
  else
    insert into public.ranked_queue (player_id, elo) values (me, coalesce(my_elo, 1000))
      on conflict (player_id) do update set joined_at = now();
    return null;
  end if;
end; $$;

create or replace function public.leave_ranked_queue()
returns void language sql security definer set search_path = public as $$
  delete from public.ranked_queue where player_id = auth.uid();
$$;

-- ---------- Classement mondial par mode ------------------------------------
create or replace function public.global_ranking_by_mode(p_mode text)
returns table (id uuid, username text, level int, elo int, games_played int, mode_wins_count int)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.level, p.elo, p.games_played,
    case when p_mode = 'defis' then
      coalesce((p.mode_wins->>'atw')::int,0) + coalesce((p.mode_wins->>'killer')::int,0)
      + coalesce((p.mode_wins->>'countup')::int,0) + coalesce((p.mode_wins->>'bar')::int,0)
    else coalesce((p.mode_wins->>p_mode)::int, 0) end as mode_wins_count
  from public.profiles p
  order by mode_wins_count desc, p.elo desc
  limit 50;
$$;

grant execute on function public.find_ranked_match() to authenticated;
grant execute on function public.leave_ranked_queue() to authenticated;
grant execute on function public.global_ranking_by_mode(text) to authenticated;
