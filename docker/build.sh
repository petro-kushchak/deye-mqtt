#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building frontend..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build

echo "Building Docker images..."
cd "$SCRIPT_DIR"
docker compose build

echo "Build complete!"
