---
name: backend-unit-tests
description: Write or extend Vitest unit tests for the sample backend (Node, zod, flat tests under backend/tests). Use for validators, mappers, routers, and other modules under backend/src.
---

# Backend unit tests

Backend tests are fast unit tests: no database, no network, no real server unless the packet says otherwise. Follow the patterns already in `backend/tests/` so new tests read like the existing ones.

## Layout and conventions

- Tests live flat in `backend/tests/<module>.test.ts` (for example `src/features/todos/validators.ts` -> `tests/validators.test.ts`).
- Import sources with the `.ts` extension: `import { titleSchema } from '../src/features/todos/validators.ts';`.
- Import Vitest helpers explicitly: `import { describe, expect, it, vi } from 'vitest';`.
- Style: semicolons, single quotes, 2-space indent, compact tests like the existing files.
- Run: `npm test` in `backend/` (`vitest run`). Type-check: `npm run typecheck` (tests are included).

## Patterns

Pick the seam that matches the unit. Code for each is in [references/patterns.md](references/patterns.md).

| Unit | Seam |
|------|------|
| Validators / schemas | Direct `schema.parse` / `safeParse`, table-driven with `it.each` |
| Pure mappers / helpers | Direct calls; compare return values |
| HTTP routers (if present) | Small Express app + Supertest with injected fakes |
| Modules that talk to a store | Fake the store / repository at the module boundary |

## Rules

1. Mock at module boundaries. Never mock the unit under test.
2. Cast fakes at the boundary with `as unknown as T` (or `ReturnType<typeof fn>`), never `as any`.
3. Silence expected `console.error` / `console.log` with `vi.spyOn(console, 'error').mockImplementation(() => {})` when the log is the behavior.
4. Restore process state you touch: `process.exitCode = undefined`, `vi.unstubAllEnvs()`.
5. Do not edit `backend/src/**`, shared fixtures, `vitest.config.ts`, or `package.json`. New helpers go inside the test file.
6. Tests never write to the repository (files, fixtures, snapshots on disk) and never use unstubbed `Math.random()` or `randomUUID()`; the host rejects both.

## Checklist before finishing

- Every new `it` asserts something observable (status, body, return value, call arguments).
- Negative paths assert that the dependency was not called.
- The file passes `npm test -- tests/<file>.test.ts` and `npm run typecheck`.
