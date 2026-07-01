#!/bin/sh
set -e

echo "Running migrations..."
if ! npx prisma migrate deploy; then
  echo "Migration failed — resolving stuck migration and retrying..."
  npx prisma migrate resolve --rolled-back "20250701000000_init" 2>/dev/null || true
  npx prisma migrate deploy
fi

echo "Running seed..."
npx prisma db seed || echo "Seed skipped or already applied."

echo "Starting API..."
exec node dist/main.js
