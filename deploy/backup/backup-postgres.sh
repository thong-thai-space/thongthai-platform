#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_ENV_FILE="$PROJECT_ROOT/deploy/backup/.env.backup"
APP_ENV_FILE="$PROJECT_ROOT/backend/.env.production"

if [[ -f "$BACKUP_ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$BACKUP_ENV_FILE"
fi

if [[ ! -f "$APP_ENV_FILE" ]]; then
  echo "Missing $APP_ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
source "$APP_ENV_FILE"

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/.backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DB_NAME="${POSTGRES_DB:-thongthai_space}"
DB_USER="${POSTGRES_USER:-thongthai}"
OUTPUT_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"

cd "$PROJECT_ROOT"

# Custom format dump for fast restore and compression.
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$OUTPUT_FILE"

echo "Backup created: $OUTPUT_FILE"

find "$BACKUP_DIR" -type f -name '*.dump' -mtime "+$RETENTION_DAYS" -delete

echo "Old backups older than $RETENTION_DAYS days have been removed."
