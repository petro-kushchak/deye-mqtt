#!/bin/sh
set -e

BACKEND_URL="${BACKEND_URL:-http://deye-backend:8000}"
BACKEND_WS_URL="${BACKEND_WS_URL:-}"
BACKEND_ACCESS_KEY="${BACKEND_ACCESS_KEY:-}"
FACILITY_NAME="${FACILITY_NAME:-}"

echo "Generating config with BACKEND_URL=$BACKEND_URL"
echo "Generating config with BACKEND_WS_URL=$BACKEND_WS_URL"
echo "Generating config with BACKEND_ACCESS_KEY=$BACKEND_ACCESS_KEY"
echo "Generating config with FACILITY_NAME=$FACILITY_NAME"

envsubst '${BACKEND_URL} ${BACKEND_WS_URL} ${BACKEND_ACCESS_KEY} ${FACILITY_NAME}' < /usr/share/nginx/html/config.json.template > /usr/share/nginx/html/config.json
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Config files generated:"
cat /usr/share/nginx/html/config.json
echo "---"
cat /etc/nginx/conf.d/default.conf
echo "---"

echo "Starting nginx..."
exec "$@"
