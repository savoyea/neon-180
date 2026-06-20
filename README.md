# Dart-180 🎯

Plateforme sociale de scoring de fléchettes — *« le Strava des fléchettes »*.

## Stack
- **Frontend** : React 18 + Vite + React Router
- **Backend / DB / Auth / Realtime** : Supabase (Postgres + Auth + Realtime, RLS)
- **Premium** : Stripe (phase ultérieure — Dart-180+)

## Démarrer
```bash
nvm use v25.8.0      # Node 18+ requis
npm install
npm run dev          # http://localhost:4180
```
Sans clés Supabase, l'app tourne en **mode démo local** (session stockée dans le navigateur).

## Connecter Supabase
1. Crée un projet sur https://supabase.com
2. `cp .env.example .env` puis renseigne `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
3. Dans Supabase Studio → SQL Editor, exécute [`supabase/schema.sql`](supabase/schema.sql)
4. Redémarre `npm run dev` — les comptes réels sont actifs.

## Structure
```
src/
  lib/             supabase.js (client) · auth.jsx (contexte d'auth + mode démo)
  components/       TopBar · BottomNav · Board
    game/           DartGame · BarGame · DartPad · PlayersStrip · CricketGrid
                    · AtwBoard · BarBoard · GameFX · WinModal
  screens/          Splash · Login · Signup · Home · Play · Game · Stats · History · Profile
  game/
    modes.js        catalogue (chrome : icône / tag / description)
    GameContext.jsx état React : roster, historique, partie courante, orchestration
    engine/         LOGIQUE PURE (sans React)
      core.js       createGame · applyDart · endTurn · undo · modeAction · buildRecord
      registry.js   fusionne logique + présentation ; point d'extension des modes
      constants.js  plateau, solveur de checkout, helpers
      turn.js       avancement de tour par défaut
      modes/        x01 · cricket · atw · killer · countup · bar
supabase/           schema.sql (profiles, games, RLS, trigger d'inscription)
```

### Ajouter un mode de jeu
1. Crée `src/game/engine/modes/<clé>.js` implémentant l'interface (`applyDart`, `scoreboard`, `pad`, `rank`, `resultSub`…).
2. Importe-le dans `engine/registry.js` (`MODULES`).
3. Déclare son chrome (icône / tag / description) dans `game/modes.js`.
Le reste de l'app (accueil, sélecteur, pavé, fin de partie) le découvre automatiquement.

## Roadmap
- **P1 ✅** Socle React + Supabase (auth, profils, app shell)
- **P2 ✅** Moteur de jeu entièrement porté en React (6 modes), modulaire + enregistrement local des parties & stats
- **P3** Amis & statuts · **P4** Multijoueur temps réel (Realtime) · **P5** Ligues & classements
- **P6** Gamification (XP/badges/emotes) · puis **Dart-180+** (freemium Stripe)
