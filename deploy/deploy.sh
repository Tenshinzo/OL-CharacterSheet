#!/usr/bin/env bash
# Deploy (or roll back) the production stack. Run as the deploy user on the server:
#   bash /opt/olchar/app/deploy/deploy.sh [git-ref]
# git-ref defaults to origin/main; pass a commit sha or tag to roll back.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/olchar/app}"
COMPOSE=(docker compose -f docker-compose.prod.yml)
REF="${1:-origin/main}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-90}"

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "ERROR: $APP_DIR/.env is missing. Copy deploy/.env.production.example and fill it in." >&2
  exit 1
fi

echo "==> Fetching $REF"
git fetch --prune origin
git reset --hard "$REF"
git log -1 --oneline

echo "==> Building app image"
"${COMPOSE[@]}" build --pull app

echo "==> Starting stack"
"${COMPOSE[@]}" up -d --remove-orphans

echo "==> Waiting for app health (timeout ${HEALTH_TIMEOUT}s)"
deadline=$(( $(date +%s) + HEALTH_TIMEOUT ))
healthy=0
while (( $(date +%s) < deadline )); do
  cid="$("${COMPOSE[@]}" ps -q app 2>/dev/null || true)"
  if [[ -n "$cid" ]]; then
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo unknown)"
    if [[ "$status" == "healthy" ]]; then
      healthy=1
      break
    fi
    if [[ "$status" == "exited" || "$status" == "dead" ]]; then
      echo "ERROR: app container exited" >&2
      break
    fi
  fi
  sleep 3
done

if (( healthy == 0 )); then
  echo "ERROR: app did not become healthy within ${HEALTH_TIMEOUT}s. Recent logs:" >&2
  "${COMPOSE[@]}" logs --tail=100 app >&2 || true
  exit 1
fi

# Belt and braces: hit the endpoint from inside the container.
"${COMPOSE[@]}" exec -T app wget -qO- http://127.0.0.1:3000/api/health
echo

echo "==> Status"
"${COMPOSE[@]}" ps

echo "==> Pruning dangling images"
docker image prune -f >/dev/null || true

echo "==> Deployed $(git rev-parse --short HEAD)"
