#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${RUST_GATEWAY_URL:-http://localhost:18789}"
AUTH_TOKEN="${RUST_GATEWAY_TOKEN:-}"

echo "Gateway smoke check target: ${BASE_URL}"

auth_header=()
if [[ -n "${AUTH_TOKEN}" ]]; then
  auth_header=(-H "Authorization: Bearer ${AUTH_TOKEN}")
fi

fetch() {
  local path="$1"
  echo ""
  echo "==> GET ${path}"
  curl -fsS "${auth_header[@]}" "${BASE_URL}${path}" | jq '.'
}

fetch "/v1/health"
fetch "/v1/models"
fetch "/v1/skills"
fetch "/v1/security/audit"
fetch "/v1/channels"
fetch "/v1/channels/pairing"
fetch "/v1/nodes"
fetch "/v1/cron/jobs"
fetch "/v1/sessions"

echo ""
echo "Gateway control-plane smoke check passed."
