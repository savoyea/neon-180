# 🎯 Fléchettes — Défi de bar & co

Application web de scoring de fléchettes (mobile/Android), 100 % autonome.
Modes : X01 (501→201), Cricket (10/15), Tour du monde (mort subite), Killer, Score Max, **Défi de bar** 🍻.

## Lancer en local
Ouvre simplement `index.html` dans un navigateur. Sur Android : « Ajouter à l'écran d'accueil ».

## Mettre en ligne (gratuit)

### Option A — Netlify lié à GitHub (déploiement auto à chaque modif)
1. Pousse ce dossier sur un dépôt GitHub.
2. Sur https://app.netlify.com → **Add new site → Import an existing project → GitHub**.
3. Choisis ce dépôt. Laisse les réglages par défaut (aucune commande de build, dossier de publication `.`).
4. **Deploy**. Ton site est en ligne sur `https://<nom>.netlify.app`.

### Option B — Netlify Drop (le plus rapide, sans GitHub)
Va sur https://app.netlify.com/drop et glisse `index.html` (ou ce dossier).

## Structure
- `index.html` — l'application complète (HTML + CSS + JS en un seul fichier)
- `netlify.toml` — config de déploiement statique
