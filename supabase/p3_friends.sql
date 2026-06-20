-- ============================================================================
-- Dart-180 — Phase 3 : amis & statuts
-- À exécuter dans Supabase → SQL Editor (ou via psql).
-- ============================================================================

-- ---------- PRÉSENCE sur les profils ----------------------------------------
alter table public.profiles add column if not exists last_seen timestamptz not null default now();
alter table public.profiles add column if not exists status text not null default 'offline'; -- online | offline | in_game

-- recherche par pseudo (insensible à la casse)
create index if not exists profiles_username_lower_idx on public.profiles (lower(username));

-- ---------- AMITIÉS ---------------------------------------------------------
create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  addressee_id  uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'pending',   -- pending | accepted
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index if not exists friendships_addressee_idx on public.friendships (addressee_id);
create index if not exists friendships_requester_idx on public.friendships (requester_id);

alter table public.friendships enable row level security;

-- Lecture : les deux parties voient la relation
drop policy if exists "friendships visible to both" on public.friendships;
create policy "friendships visible to both" on public.friendships
  for select using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Création : on n'envoie une demande qu'en son propre nom
drop policy if exists "friendships insert by requester" on public.friendships;
create policy "friendships insert by requester" on public.friendships
  for insert with check (requester_id = auth.uid());

-- Mise à jour (accepter) : réservé au destinataire
drop policy if exists "friendships accept by addressee" on public.friendships;
create policy "friendships accept by addressee" on public.friendships
  for update using (addressee_id = auth.uid());

-- Suppression (annuler / refuser / retirer un ami) : l'une des deux parties
drop policy if exists "friendships delete by either" on public.friendships;
create policy "friendships delete by either" on public.friendships
  for delete using (requester_id = auth.uid() or addressee_id = auth.uid());
