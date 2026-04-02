#!/bin/bash
set -e

echo "=========================================="
echo "Building Docker Images"
echo "=========================================="

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

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

echo "Updating backend version to $VERSION..."
echo "$VERSION" > backend/src/VERSION
cat backend/src/VERSION

echo ""
echo "Building backend image..."
docker build -f docker/Dockerfile.backend \
    -t "${BACKEND_IMAGE}:${VERSION}" \
    "$PROJECT_DIR"

echo "Building frontend image..."
docker build -f docker/Dockerfile.frontend \
    -t "${FRONTEND_IMAGE}:${VERSION}" \
    "$PROJECT_DIR"

echo ""
echo "=========================================="
echo "Build completed!"
echo "=========================================="
echo ""
echo "Built images:"
echo "  Backend: ${BACKEND_IMAGE}:${VERSION}"
echo "  Frontend: ${FRONTEND_IMAGE}:${VERSION}"
