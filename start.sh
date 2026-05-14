#!/bin/sh
set -e

echo "==> Running database migrations..."
npx prisma db push --skip-generate

echo "==> Seeding admin account..."
npx prisma db seed

echo "==> Starting Next.js..."
exec node server.js
