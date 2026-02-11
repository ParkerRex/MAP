#!/usr/bin/env bash
set -euo pipefail

echo "Running web cutover regression tests..."
bun run test:cutover:web

echo "Running gateway model runtime regression tests..."
cargo test -p map-gateway --manifest-path backend/Cargo.toml model_runtime::tests

echo "Rust/Postgres cutover verification passed."
