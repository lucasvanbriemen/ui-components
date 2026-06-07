#!/bin/bash
# Run ON THE SERVER (as root) after editing ui-components.
# Pulls the latest ui-components, then for every app that uses it:
# recompiles assets (the apps build every shared *.scss into their own
# builds dir, so a new shared stylesheet 500s an app that hasn't rebuilt)
# and restarts it (production caches templates + eager-loads helpers).
set -euo pipefail

UI_COMPONENTS=/var/www/vhosts/ltvb.nl/ui-components
RBENV_SHIMS=/var/www/vhosts/ltvb.nl/.rbenv/shims

# Each app that consumes ui-components. Add new app roots here.
APPS=(
  /var/www/vhosts/ltvb.nl/login.ltvb.nl
  /var/www/vhosts/ltvb.nl/music.ltvb.nl
)

cd "$UI_COMPONENTS"
git pull --ff-only

for app in "${APPS[@]}"; do
  if [ ! -d "$app" ]; then
    echo "skipped (missing): $app"
    continue
  fi

  # SECRET_KEY_BASE_DUMMY covers apps that keep no secrets on disk (login);
  # apps with a real .env (music) load it via dotenv instead.
  (cd "$app" && sudo -u ltvb env HOME=/var/www/vhosts/ltvb.nl \
    PATH="$RBENV_SHIMS:/usr/local/bin:/usr/bin:/bin" \
    RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1 \
    bundle exec rails assets:precompile)

  sudo -u ltvb mkdir -p "$app/tmp"
  sudo -u ltvb touch "$app/tmp/restart.txt"
  echo "rebuilt + restarted: $app"
done
