#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pids=()
pgids=()

if [[ -t 1 ]]; then
  RED=$'\033[31m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  BLUE=$'\033[34m'
  MAGENTA=$'\033[35m'
  RESET=$'\033[0m'
else
  RED=""
  GREEN=""
  YELLOW=""
  BLUE=""
  MAGENTA=""
  RESET=""
fi

info() { echo "${BLUE}[info]${RESET} $*"; }
warn() { echo "${YELLOW}[warn]${RESET} $*"; }
error() { echo "${RED}[error]${RESET} $*"; }

usage() {
  cat <<'EOF'
Usage: scripts/dev-start.sh [options]

Options:
  --port <port>           Port for Next.js (default: 3000)
  --tunnel <mode>         off | try | named (default: off)
  --tunnel-name <name>    Cloudflare named tunnel (default: map-ai)
  -h, --help              Show this help

Examples:
  bun run dev:all
  bun run dev:all -- --tunnel try
  bun run dev:all -- --tunnel named --tunnel-name map-ai
EOF
}

tagged_run() {
  local tag="$1"
  shift
  if command -v setsid >/dev/null 2>&1; then
    (setsid "$@" 2>&1 | sed -u "s/^/[${tag}] /") &
  else
    ("$@" 2>&1 | sed -u "s/^/[${tag}] /") &
  fi
  local pid="$!"
  pids+=("$pid")
  pgids+=("$pid")
}

shutdown() {
  echo ""
  warn "Stopping processes..."
  for pgid in "${pgids[@]:-}"; do
    kill -TERM -"${pgid}" 2>/dev/null || true
  done
  for pid in "${pids[@]:-}"; do
    kill -TERM "$pid" 2>/dev/null || true
  done
  sleep 1
  for pgid in "${pgids[@]:-}"; do
    kill -KILL -"${pgid}" 2>/dev/null || true
  done
  for pid in "${pids[@]:-}"; do
    kill -KILL "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true

  if [[ "${POSTGRES_STARTED:-false}" == "true" ]]; then
    warn "Stopping postgres..."
    docker compose stop postgres >/dev/null 2>&1 || true
  fi
}

trap shutdown INT TERM EXIT

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    error "$cmd is required but not found."
    exit 1
  fi
}

port_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${port}" -sTCP:LISTEN -t >/dev/null 2>&1
  elif command -v nc >/dev/null 2>&1; then
    nc -z localhost "${port}" >/dev/null 2>&1
  else
    return 1
  fi
}

wait_for_postgres() {
  local timeout="$1"
  local start
  start="$(date +%s)"
  local container_id
  container_id="$(docker compose ps -q postgres 2>/dev/null || true)"
  if [[ -z "$container_id" ]]; then
    return 1
  fi
  while true; do
    local status
    status="$(docker inspect -f '{{.State.Health.Status}}' "$container_id" 2>/dev/null || true)"
    if [[ "$status" == "healthy" ]]; then
      return 0
    fi
    if [[ "$status" == "unhealthy" ]]; then
      return 1
    fi
    if (( $(date +%s) - start >= timeout )); then
      return 1
    fi
    sleep 1
  done
}

wait_for_http() {
  local url="$1"
  local timeout="$2"
  local start
  start="$(date +%s)"
  while true; do
    if command -v curl >/dev/null 2>&1; then
      if curl -fsS "$url" >/dev/null 2>&1; then
        return 0
      fi
    elif command -v nc >/dev/null 2>&1; then
      local host
      host="$(echo "$url" | sed -E 's#https?://##' | cut -d/ -f1 | cut -d: -f1)"
      local port
      port="$(echo "$url" | sed -E 's#https?://##' | cut -d/ -f1 | cut -d: -f2)"
      if [[ -n "$host" && -n "$port" ]]; then
        if nc -z "$host" "$port" >/dev/null 2>&1; then
          return 0
        fi
      fi
    fi

    if (( $(date +%s) - start >= timeout )); then
      return 1
    fi
    sleep 0.5
  done
}

PORT="${PORT:-3000}"
TUNNEL_MODE="${TUNNEL_MODE:-off}"
TUNNEL_NAME="${TUNNEL_NAME:-map-ai}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-60}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      PORT="$2"
      shift 2
      ;;
    --port=*)
      PORT="${1#*=}"
      shift
      ;;
    --tunnel)
      TUNNEL_MODE="$2"
      shift 2
      ;;
    --tunnel=*)
      TUNNEL_MODE="${1#*=}"
      shift
      ;;
    --tunnel-name)
      TUNNEL_NAME="$2"
      shift 2
      ;;
    --tunnel-name=*)
      TUNNEL_NAME="${1#*=}"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      error "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

case "$TUNNEL_MODE" in
  off|none)
    TUNNEL_MODE="off"
    ;;
  try|trycloudflare|ephemeral)
    TUNNEL_MODE="try"
    ;;
  named)
    TUNNEL_MODE="named"
    ;;
  *)
    error "Invalid tunnel mode: $TUNNEL_MODE (use off, try, or named)"
    exit 1
    ;;
esac

require_cmd docker
require_cmd bun

if ! docker compose version >/dev/null 2>&1; then
  error "docker compose is required but not available."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  error "docker is installed but not running."
  exit 1
fi

if [[ "$TUNNEL_MODE" != "off" ]]; then
  require_cmd cloudflared
fi

if port_in_use "$PORT"; then
  error "Port $PORT is in use. Free it or pass --port <port>."
  exit 1
fi

if port_in_use 54324; then
  error "Port 54324 is in use. Free it before starting postgres."
  exit 1
fi

POSTGRES_STARTED=false
existing_container_id="$(docker compose ps -q postgres 2>/dev/null || true)"
if [[ -n "$existing_container_id" ]]; then
  existing_status="$(docker inspect -f '{{.State.Status}}' "$existing_container_id" 2>/dev/null || true)"
  if [[ "$existing_status" == "running" ]]; then
    info "Postgres already running."
  else
    docker compose up -d postgres
    POSTGRES_STARTED=true
  fi
else
  docker compose up -d postgres
  POSTGRES_STARTED=true
fi

tagged_run "${YELLOW}postgres${RESET}" docker compose logs -f postgres

if wait_for_postgres "$WAIT_TIMEOUT"; then
  info "Postgres is healthy."
else
  warn "Postgres health check timed out after ${WAIT_TIMEOUT}s."
fi

if [[ -z "${NEXT_PUBLIC_APP_URL:-}" ]]; then
  export NEXT_PUBLIC_APP_URL="http://localhost:${PORT}"
  info "NEXT_PUBLIC_APP_URL not set; defaulting to ${NEXT_PUBLIC_APP_URL}"
fi

tagged_run "${BLUE}web${RESET}" bun run dev:next -- --port "$PORT"

if wait_for_http "http://localhost:${PORT}" "$WAIT_TIMEOUT"; then
  info "Web server is responding."
else
  warn "Web server did not respond within ${WAIT_TIMEOUT}s."
fi

if [[ "$TUNNEL_MODE" == "try" ]]; then
  info "Starting Cloudflare Tunnel (ephemeral URL)..."
  tagged_run "${MAGENTA}tunnel${RESET}" cloudflared tunnel --url "http://localhost:${PORT}"
  info "Find the public URL in tunnel logs (https://*.trycloudflare.com)."
elif [[ "$TUNNEL_MODE" == "named" ]]; then
  info "Starting Cloudflare Tunnel (named: ${TUNNEL_NAME})..."
  tagged_run "${MAGENTA}tunnel${RESET}" cloudflared tunnel run "$TUNNEL_NAME"
  info "Ensure the named tunnel exists and points at http://localhost:${PORT}."
fi

info "Web: http://localhost:${PORT}"
info "Postgres: localhost:54324 (container 5432)"
if [[ "$TUNNEL_MODE" != "off" ]]; then
  warn "Set NEXT_PUBLIC_APP_URL to your tunnel URL and restart dev server for OAuth."
fi
echo "${GREEN}[ready]${RESET} Services running. Press Ctrl+C to stop."

wait
