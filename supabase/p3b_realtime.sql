-- ============================================================================
-- Dart-180 — P3b : Realtime sur friendships
-- Permet au demandeur d'être notifié en direct quand sa demande est acceptée.
-- ============================================================================

-- Inclure l'ancienne valeur de ligne dans les events UPDATE/DELETE
alter table public.friendships replica identity full;

-- Ajouter la table à la publication Realtime (si pas déjà fait)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friendships'
  ) then
    alter publication supabase_realtime add table public.friendships;
  end if;
end $$;
