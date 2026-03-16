#!/bin/sh
set -eu

echo "[entrypoint] Running Prisma migrations"
node_modules/.bin/prisma migrate deploy

echo "[entrypoint] Starting NestJS app"
exec node dist/src/main.js