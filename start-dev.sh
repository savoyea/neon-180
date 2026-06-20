#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use v25.8.0 2>/dev/null
cd /Users/arsav/SaasTrading/dart-180
exec npm run dev
