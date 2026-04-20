#!/bin/sh
set -e

echo "Running Payload migrations..."
pnpm payload migrate

echo "Starting Next.js..."
exec "$@"
