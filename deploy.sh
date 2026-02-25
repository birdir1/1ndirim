#!/usr/bin/env bash
set -euo pipefail

msg="${1:-}"
if [[ -z "$msg" ]]; then
  echo "Usage: ./deploy.sh \"message\""
  exit 1
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$root_dir"

git add -A
if git diff --cached --quiet; then
  echo "No local changes to commit."
else
  git commit -m "$msg"
fi

git push origin main

ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes root@37.140.242.105 <<'SERVER'
set -euo pipefail

# Backend
cd /var/www/1indirim-api/backend
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Backend has local changes; aborting."
  git status -sb
  exit 1
fi

git pull
npm ci
npm run add-sources
pm2 restart 0 --update-env

# Bot
cd /var/www/1indirim-bot/bot
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Bot has local changes; aborting."
  git status -sb
  exit 1
fi

git pull
npm ci
pm2 restart 2 --update-env

# Admin panel
cd /var/www/1indirim-admin/admin-panel
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Admin has local changes; aborting."
  git status -sb
  exit 1
fi

git pull
npm ci
npm run build
pm2 restart 1 --update-env
SERVER
