#!/bin/sh
set -e

echo "==> Running database migrations..."
npx prisma db push --skip-generate

echo "==> Seeding admin account..."
npx ts-node --esm prisma/seed.ts

echo "==> Starting Next.js..."
exec npm start
