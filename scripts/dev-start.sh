#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pids=()

tagged_run() {
  local tag="$1"
  shift
  ("$@" 2>&1 | sed -u "s/^/[${tag}] /") &
  pids+=("$!")
}

shutdown() {
  echo ""
  echo "[shutdown] Stopping processes..."
  for pid in "${pids[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true

  if command -v docker >/dev/null 2>&1; then
    echo "[shutdown] Stopping docker services..."
    docker compose down
  fi
}

trap shutdown INT TERM

if ! command -v docker >/dev/null 2>&1; then
  echo "[error] docker is required but not found."
  exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "[error] cloudflared is required but not found."
  exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "[error] bun is required but not found."
  exit 1
fi

# Start postgres (and only postgres) in the background

docker compose up -d postgres

# Stream postgres logs for visibility

tagged_run "postgres" docker compose logs -f postgres

# Start web server

tagged_run "web" bun run dev

# Start Cloudflare tunnel

tagged_run "tunnel" cloudflared tunnel run map-ai

# Boot and open iOS simulator
if command -v xcrun >/dev/null 2>&1; then
  SIM_NAME="${SIMULATOR_NAME:-iPhone 15}"
  tagged_run "sim" xcrun simctl boot "$SIM_NAME"
fi

tagged_run "sim" open -a Simulator

echo "[ready] Services running. Press Ctrl+C to stop."

wait
