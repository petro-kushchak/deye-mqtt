#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Building frontend..."
cd "$SCRIPT_DIR/frontend"
npm install
npm run build

echo "Building Docker image..."
cd "$SCRIPT_DIR/docker"
docker compose build

echo "Starting container..."
cd "$SCRIPT_DIR/docker"
docker compose up -d

echo "Done! App running at http://localhost:8070"
