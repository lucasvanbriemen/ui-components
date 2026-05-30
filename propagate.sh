#!/bin/bash
# Run ON THE SERVER after editing shared-ui.
# Pulls the latest shared-ui and restarts every app that uses it so the
# changes take effect (production caches templates + eager-loads helpers).
set -euo pipefail

SHARED_UI=/var/www/vhosts/ltvb.nl/shared-ui

# Each app that consumes shared-ui. Add new app roots here.
APPS=(
  /var/www/vhosts/ltvb.nl/login.ltvb.nl
)

cd "$SHARED_UI"
git pull --ff-only

for app in "${APPS[@]}"; do
  if [ -d "$app" ]; then
    mkdir -p "$app/tmp"
    touch "$app/tmp/restart.txt"
    echo "restarted: $app"
  else
    echo "skipped (missing): $app"
  fi
done
