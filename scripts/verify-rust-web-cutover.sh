#!/usr/bin/env bash
set -euo pipefail

echo "Running gateway test suite..."
bun run test:gateway

echo "Running rust/postgres cutover verification script..."
bun run verify:rust-cutover

echo "Rust/web cutover verification passed."
