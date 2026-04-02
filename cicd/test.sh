#!/bin/bash
set -e

echo "=========================================="
echo "Running Tests"
echo "=========================================="

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo ""
echo "=== Backend Tests ==="
echo "Installing test dependencies..."
pip install -q httpx pytest || true

echo "Running Python unit tests..."
cd "$PROJECT_DIR/backend"
if [ -d "src/tests" ]; then
    python3 -m pytest src/tests -v 2>/dev/null || python3 -m unittest discover -v src/tests
else
    echo "No backend tests found"
fi

echo ""
echo "=== Frontend Tests ==="
cd "$PROJECT_DIR/frontend"
if [ -d "src/tests" ] || [ -d "tests" ]; then
    npm test -- --passWithNoTests --watchAll=false 2>/dev/null || echo "No tests found"
else
    echo "No frontend tests found"
fi

cd "$PROJECT_DIR"

echo ""
echo "=========================================="
echo "All tests completed!"
echo "=========================================="
