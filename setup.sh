#!/usr/bin/env bash

set -e # Exit immediately if a command exits with a non-zero status

echo "Removing previous migrations..."
rm -rf db/migrations

# echo "Installing dependencies..."
# npm i

echo "Compiling the project (TypeScript)..."
npx tsc

echo "Launching Postgres database via Docker..."
docker compose up -d
sleep 2

echo "Generating migration schema..."
npx squid-typeorm-migration generate

echo "Applying database migrations..."
npx squid-typeorm-migration apply

echo "Running indexer and graph service..."
sqd run .
