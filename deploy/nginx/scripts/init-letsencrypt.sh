#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/deploy/nginx/.env.proxy"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  echo "Copy deploy/nginx/.env.proxy.example to deploy/nginx/.env.proxy first."
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

if [[ -z "${DOMAIN:-}" || -z "${LETSENCRYPT_EMAIL:-}" ]]; then
  echo "DOMAIN and LETSENCRYPT_EMAIL are required in $ENV_FILE"
  exit 1
fi

cd "$PROJECT_ROOT"

mkdir -p deploy/nginx/certbot/www deploy/nginx/certbot/conf

# Start nginx in HTTP mode first so ACME challenge path is reachable.
docker compose \
  -f docker-compose.prod.yml \
  -f deploy/nginx/docker-compose.proxy.yml \
  --env-file backend/.env.production \
  --env-file deploy/nginx/.env.proxy \
  up -d backend frontend nginx

docker compose \
  -f docker-compose.prod.yml \
  -f deploy/nginx/docker-compose.proxy.yml \
  --env-file backend/.env.production \
  --env-file deploy/nginx/.env.proxy \
  run --rm --no-deps certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$LETSENCRYPT_EMAIL" \
  --agree-tos --no-eff-email

# Reload nginx with SSL cert mounted.
docker compose \
  -f docker-compose.prod.yml \
  -f deploy/nginx/docker-compose.proxy.yml \
  --env-file backend/.env.production \
  --env-file deploy/nginx/.env.proxy \
  restart nginx

echo "SSL certificate issued for $DOMAIN"
