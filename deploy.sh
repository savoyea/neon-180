#!/bin/bash
# Déploiement Dart-180 → VPS dart.arsava.fr
# Workflow : commit local → git push → VPS git pull + build
# Usage: ./deploy.sh

set -e

echo "🔨 Build local (vérification)..."
source ~/.nvm/nvm.sh 2>/dev/null && nvm use 25 2>/dev/null
npm run build

echo "📤 Push GitHub..."
git push origin main

echo "🚀 Déploiement sur le VPS..."
ssh -i ~/.ssh/id_rsa ubuntu@51.68.120.195 "bash ~/deploy-dart.sh"

echo "✅ Déployé sur https://dart.arsava.fr"
