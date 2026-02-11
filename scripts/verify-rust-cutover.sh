#!/usr/bin/env bash
set -euo pipefail

echo "Running web cutover regression tests..."
bun test \
  src/no-convex-imports.test.ts \
  src/lib/client-api.test.ts \
  src/app/api/goals/validation.test.ts

echo "Running gateway model runtime regression tests..."
cargo test --manifest-path backend/apps/gateway/Cargo.toml model_runtime::tests

echo "Rust/Postgres cutover verification passed."
