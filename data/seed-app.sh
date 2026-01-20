#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_FILE="$ROOT_DIR/data/seed-app.sql"
ENV_FILE="$ROOT_DIR/.env"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Seed file not found: $SQL_FILE" >&2
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DB_URL="${DIRECT_URL:-${DATABASE_URL:-}}"
if [[ -z "$DB_URL" ]]; then
  echo "Set DIRECT_URL or DATABASE_URL before running this script (or define them in .env)." >&2
  exit 1
fi

if command -v psql >/dev/null 2>&1; then
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
  exit 0
fi

if command -v bunx >/dev/null 2>&1; then
  (cd "$ROOT_DIR/client" && bunx prisma db execute --file ../data/seed-app.sql)
  exit 0
fi

if command -v npx >/dev/null 2>&1; then
  (cd "$ROOT_DIR/client" && npx prisma db execute --file ../data/seed-app.sql)
  exit 0
fi

echo "No SQL runner found. Install psql, bunx, or npx to run seed-app.sql." >&2
exit 1
