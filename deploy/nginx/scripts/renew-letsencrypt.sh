#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/deploy/nginx/.env.proxy"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

cd "$PROJECT_ROOT"

docker compose \
  -f docker-compose.prod.yml \
  -f deploy/nginx/docker-compose.proxy.yml \
  --env-file backend/.env.production \
  --env-file deploy/nginx/.env.proxy \
  run --rm --no-deps certbot renew --webroot -w /var/www/certbot

docker compose \
  -f docker-compose.prod.yml \
  -f deploy/nginx/docker-compose.proxy.yml \
  --env-file backend/.env.production \
  --env-file deploy/nginx/.env.proxy \
  exec -T nginx nginx -s reload

echo "Certbot renew completed and nginx reloaded."
