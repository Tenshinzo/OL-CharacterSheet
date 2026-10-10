#!/usr/bin/env bash
# Nightly MySQL dump of the production database. Run as the deploy user:
#   bash /opt/olchar/app/deploy/backup.sh
# Writes /opt/olchar/backups/olchar-YYYY-MM-DD.sql.gz and keeps 14 days.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/olchar/app}"
BACKUP_DIR="${BACKUP_DIR:-/opt/olchar/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
COMPOSE=(docker compose -f docker-compose.prod.yml)

cd "$APP_DIR"
set -a
# shellcheck disable=SC1091
source ./.env
set +a

mkdir -p "$BACKUP_DIR"
chmod 0750 "$BACKUP_DIR"

stamp="$(date +%F)"
target="$BACKUP_DIR/olchar-${stamp}.sql.gz"
tmp="${target}.part"

# Password is passed via env to avoid showing it in `ps`.
"${COMPOSE[@]}" exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" db \
  mysqldump --single-transaction --quick --routines --triggers --events \
  --set-gtid-purged=OFF -uroot "$MYSQL_DATABASE" | gzip -9 > "$tmp"

# Sanity check: a valid dump ends with the completion marker.
if ! gzip -dc "$tmp" | tail -n 5 | grep -q "Dump completed"; then
  echo "ERROR: dump looks incomplete, keeping $tmp for inspection" >&2
  exit 1
fi
mv "$tmp" "$target"
chmod 0640 "$target"

find "$BACKUP_DIR" -name 'olchar-*.sql.gz' -type f -mtime "+$KEEP_DAYS" -delete

echo "backup written: $target ($(du -h "$target" | cut -f1))"
