#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_ENV_FILE="$PROJECT_ROOT/backend/.env.production"

if [[ $# -lt 1 ]]; then
  echo "Usage: bash deploy/backup/restore-postgres.sh <path_to_dump_file>"
  exit 1
fi

DUMP_FILE="$1"
if [[ ! -f "$DUMP_FILE" ]]; then
  echo "Dump file not found: $DUMP_FILE"
  exit 1
fi

if [[ ! -f "$APP_ENV_FILE" ]]; then
  echo "Missing $APP_ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
source "$APP_ENV_FILE"

DB_NAME="${POSTGRES_DB:-thongthai_space}"
DB_USER="${POSTGRES_USER:-thongthai}"

cd "$PROJECT_ROOT"

echo "About to restore $DUMP_FILE into database $DB_NAME"
echo "Press Ctrl+C to cancel, Enter to continue"
read -r _

# --clean + --if-exists drops old objects before restore.
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists < "$DUMP_FILE"

echo "Restore completed."
