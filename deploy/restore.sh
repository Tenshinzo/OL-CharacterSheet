#!/usr/bin/env bash
# Restore a backup produced by backup.sh into the running db container.
#   bash /opt/olchar/app/deploy/restore.sh /opt/olchar/backups/olchar-2026-10-10.sql.gz
# This DROPS and recreates all tables contained in the dump. Stops the app
# during the restore so no writes are lost, then starts it again.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/olchar/app}"
COMPOSE=(docker compose -f docker-compose.prod.yml)
FILE="${1:-}"

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "usage: restore.sh <backup.sql.gz>" >&2
  exit 1
fi

cd "$APP_DIR"
set -a
# shellcheck disable=SC1091
source ./.env
set +a

echo "About to restore '$FILE' into database '$MYSQL_DATABASE'. ALL CURRENT DATA WILL BE REPLACED."
read -r -p "Type 'yes' to continue: " answer
[[ "$answer" == "yes" ]] || { echo "aborted"; exit 1; }

echo "==> Stopping app"
"${COMPOSE[@]}" stop app

echo "==> Restoring"
case "$FILE" in
  *.gz) reader=(gzip -dc "$FILE") ;;
  *)    reader=(cat "$FILE") ;;
esac
"${reader[@]}" | "${COMPOSE[@]}" exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" db \
  mysql -uroot "$MYSQL_DATABASE"

echo "==> Starting app (runs pending migrations on startup)"
"${COMPOSE[@]}" start app
"${COMPOSE[@]}" ps
echo "restore complete"
