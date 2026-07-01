#!/bin/bash
# Déploiement Dart-180 → VPS dart.arsava.fr
# Usage: ./deploy.sh

set -e

VPS="ubuntu@51.68.120.195"
KEY="$HOME/.ssh/id_rsa"
REMOTE_WEB="/var/www/dart"
REMOTE_PB="/opt/pocketbase/dart"

echo "🔨 Build..."
source ~/.nvm/nvm.sh 2>/dev/null && nvm use 25 2>/dev/null
npm run build

echo "📦 Upload dist/..."
expect -c "
  set timeout 60
  spawn rsync -avz --delete -e {ssh -i $KEY -o StrictHostKeyChecking=no} dist/ ${VPS}:${REMOTE_WEB}/
  expect {passphrase} { send {louboutin\r}; exp_continue }
  expect eof
"

echo "📦 Upload hooks..."
expect -c "
  set timeout 30
  spawn rsync -avz -e {ssh -i $KEY -o StrictHostKeyChecking=no} pb_hooks/ ${VPS}:${REMOTE_PB}/pb_hooks/
  expect {passphrase} { send {louboutin\r}; exp_continue }
  expect eof
"

echo "🔄 Restart PocketBase..."
expect -c "
  set timeout 15
  spawn ssh -i $KEY -o StrictHostKeyChecking=no $VPS {pkill -f 'pocketbase.*8092'; sleep 1; nohup /opt/pocketbase/dart/pocketbase serve --http=127.0.0.1:8092 --dir=/opt/pocketbase/dart/data > /opt/pocketbase/dart/pb.log 2>&1 &}
  expect {passphrase} { send {louboutin\r}; exp_continue }
  expect eof
"

echo "✅ Déployé sur https://dart.arsava.fr"
