#!/bin/bash
set -e

echo "=========================================="
echo "Publishing Docker Images"
echo "=========================================="

VERSION="${1:-latest}"
REGISTRY="${REGISTRY:-docker.io/pkushchak}"
BACKEND_IMAGE="${REGISTRY}/deye-mqtt"
FRONTEND_IMAGE="${REGISTRY}/deye-frontend"

echo ""
echo "Configuration:"
echo "  Version: $VERSION"
echo "  Backend: ${BACKEND_IMAGE}:${VERSION}"
echo "  Frontend: ${FRONTEND_IMAGE}:${VERSION}"
echo ""

if [ -z "$REGISTRY" ]; then
    echo "Error: REGISTRY environment variable is required"
    exit 1
fi

read -p "Push to ${REGISTRY}? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "=== Publishing Backend ==="
docker push "${BACKEND_IMAGE}:${VERSION}"
echo "Pushed: ${BACKEND_IMAGE}:${VERSION}"

echo ""
echo "=== Publishing Frontend ==="
docker push "${FRONTEND_IMAGE}:${VERSION}"
echo "Pushed: ${FRONTEND_IMAGE}:${VERSION}"

echo ""
echo "=========================================="
echo "Publishing completed!"
echo "=========================================="
