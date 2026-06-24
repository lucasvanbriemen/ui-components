#!/bin/bash
# Run ON THE SERVER after editing ui-components — works either way:
#   - manually as root (drops to the `ltvb` webspace user via sudo), or
#   - as the `ltvb` deploy user (e.g. a post-deploy command from the apps
#     manager, whose worker runs as `ltvb` and may NOT sudo).
# Pulls the latest ui-components, then for every app that uses it:
# recompiles assets (the apps build every shared *.scss into their own
# builds dir, so a new shared stylesheet 500s an app that hasn't rebuilt)
# and restarts it (production caches templates + eager-loads helpers).
set -euo pipefail

UI_COMPONENTS=/var/www/vhosts/ltvb.nl/ui-components
RBENV_SHIMS=/var/www/vhosts/ltvb.nl/.rbenv/shims
APPS_MANAGER=/var/www/vhosts/ltvb.nl/apps.ltvb.nl

# Run a command as the ltvb webspace user. If we're already ltvb (the apps
# manager's deploy worker, which can't sudo), run it directly; if we're root
# (manual run), drop privileges via sudo. This lets the same script serve both
# entry points — `sudo -u ltvb` while already ltvb would fail (no sudo rights).
as_ltvb() {
  if [ "$(id -un)" = ltvb ]; then "$@"; else sudo -u ltvb "$@"; fi
}

# The consuming-apps list is NOT maintained here — apps.ltvb.nl is the source of
# truth. Every managed Rails app reads the shared helpers/views/assets, so we
# ask the manager for its Rails apps and rebuild each one. Add an app there and
# the next propagate picks it up automatically; nothing to edit in this file.
# (Filtered to absolute paths so dotenv/boot chatter on stdout can't leak in.)
rails_app_paths() {
  (cd "$APPS_MANAGER" && as_ltvb env HOME=/var/www/vhosts/ltvb.nl \
    PATH="$RBENV_SHIMS:/usr/local/bin:/usr/bin:/bin" RAILS_ENV=production \
    bundle exec rails runner 'App.where(app_kind: "rails").find_each { |a| puts a.app_path }' \
  ) 2>/dev/null | grep '^/'
}

mapfile -t APPS < <(rails_app_paths)
if [ "${#APPS[@]}" -eq 0 ]; then
  echo "error: apps.ltvb.nl manager ($APPS_MANAGER) returned no Rails apps — aborting" >&2
  exit 1
fi
echo "propagating to ${#APPS[@]} app(s):"
printf '  %s\n' "${APPS[@]}"

cd "$UI_COMPONENTS"
# safe.directory: the checkout is ltvb-owned; mark it so git never aborts with
# "dubious ownership" regardless of who launched the script.
as_ltvb git -c safe.directory="$UI_COMPONENTS" pull --ff-only

for app in "${APPS[@]}"; do
  if [ ! -d "$app" ]; then
    echo "skipped (missing): $app"
    continue
  fi

  # SECRET_KEY_BASE_DUMMY covers apps that keep no secrets on disk (login);
  # apps with a real .env (music) load it via dotenv instead.
  (cd "$app" && as_ltvb env HOME=/var/www/vhosts/ltvb.nl \
    PATH="$RBENV_SHIMS:/usr/local/bin:/usr/bin:/bin" \
    RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1 \
    bundle exec rails assets:precompile)

  as_ltvb mkdir -p "$app/tmp"
  as_ltvb touch "$app/tmp/restart.txt"
  echo "rebuilt + restarted: $app"
done
