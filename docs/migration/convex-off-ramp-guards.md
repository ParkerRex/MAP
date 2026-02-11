# Convex Off-Ramp Guardrails

This repo keeps legacy Convex code in place for reference, but prevents Convex from re-entering the active web runtime.

## What Is Guarded

- Runtime imports under `src/**` cannot import from `convex` or `@convex-dev/*`.
- Runtime dependencies in `package.json` cannot include `convex` or `@convex-dev/*`.
- `bun.lock` cannot include runtime Convex package entries.
- Active TypeScript scope is restricted to `src/**` and excludes legacy `convex/` code.

## Regression Tests

- `src/no-convex-imports.test.ts`
- `src/no-convex-lockfile.test.ts`
- `src/tsconfig-active-scope.test.ts`

Run:

```bash
bun test src/no-convex-imports.test.ts src/no-convex-lockfile.test.ts src/tsconfig-active-scope.test.ts
```

## TypeScript Scope

`tsconfig.json` is intentionally scoped for active app typechecking:

- `include`: `next-env.d.ts`, `src/**/*.ts`, `src/**/*.tsx`, `.next/types/**/*.ts`
- `exclude`: `node_modules`, `convex`, `.next/dev`

If you intentionally reintroduce Convex runtime paths, update these guardrails in the same PR with explicit rationale.
