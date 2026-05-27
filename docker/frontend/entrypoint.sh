#!/bin/sh
set -e

echo "Generating config.json from environment variables..."

# Build JSON array of facilities from indexed env vars
# Supports: BACKEND_URL1, BACKEND_URL2, ..., BACKEND_URLN
# Per-index: BACKEND_WS_URL{i}, BACKEND_ACCESS_KEY{i}, FACILITY_NAME{i}
# Fallback: single BACKEND_URL (backward compatible)

facilities=""
i=1

while true; do
  eval url="\${BACKEND_URL${i}:-}"
  if [ -z "$url" ]; then
    break
  fi
  eval ws_url="\${BACKEND_WS_URL${i}:-}"
  eval key="\${BACKEND_ACCESS_KEY${i}:-}"
  eval name="\${FACILITY_NAME${i}:-${url}}"

  if [ $i -gt 1 ]; then
    facilities="$facilities,"
  fi

  facilities="$facilities{
    \"backendUrl\": \"$url\",
    \"backendWsUrl\": \"$ws_url\",
    \"accessKey\": \"$key\",
    \"facilityName\": \"$name\"
  }"

  i=$((i + 1))
done

# Fallback: single BACKEND_URL (no number suffix)
if [ -z "$facilities" ] && [ -n "${BACKEND_URL:-}" ]; then
  BACKEND_WS_URL="${BACKEND_WS_URL:-}"
  BACKEND_ACCESS_KEY="${BACKEND_ACCESS_KEY:-}"
  FACILITY_NAME="${FACILITY_NAME:-Solar Dashboard}"

  facilities="{
    \"backendUrl\": \"$BACKEND_URL\",
    \"backendWsUrl\": \"$BACKEND_WS_URL\",
    \"accessKey\": \"$BACKEND_ACCESS_KEY\",
    \"facilityName\": \"$FACILITY_NAME\"
  }"
fi

if [ -z "$facilities" ]; then
  echo "WARNING: No BACKEND_URL* environment variables found. Using empty config."
  facilities="[]"
else
  facilities="[$facilities]"
fi

echo "$facilities" > /usr/share/nginx/html/config.json

echo "Generated config.json:"
cat /usr/share/nginx/html/config.json
echo "---"

# Generate nginx config
BACKEND_URL="${BACKEND_URL1:-${BACKEND_URL:-http://deye-backend:8000}}"
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Starting nginx..."
exec "$@"
