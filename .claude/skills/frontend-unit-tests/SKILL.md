---
name: frontend-unit-tests
description: Write or extend Vitest + React Testing Library unit tests for the sample frontend (React under frontend/src). Use for components, hooks, API clients, and utilities.
---

# Frontend unit tests

Tests sit next to the unit (`TodoList.tsx` -> `TodoList.test.tsx`), run in jsdom, and are type-checked by `tsc` together with production code. Follow the existing tests in `frontend/src`.

## Layout and conventions

- `*.test.tsx` for components and hooks that render, `*.test.ts` for plain modules.
- Import Vitest helpers explicitly: `import { describe, expect, it, vi } from 'vitest'`.
- Setup: `src/test/setup.ts` adds jest-dom matchers and cleanup. Do not edit it.
- Run: `npm test` in `frontend/`. Type-check: `npm run typecheck`.

## Patterns

Code for each is in [references/patterns.md](references/patterns.md).

| Unit | Seam |
|------|------|
| Leaf components | Render with Testing Library; query by role, label, and text |
| Components composed of feature children | Mock child components and hooks by module path |
| Query / mutation hooks (if present) | `renderHook` with a real `QueryClient` (`retry: false`); mock the API module |
| API / `fetch` wrappers | `vi.stubGlobal('fetch', vi.fn())` returning `new Response(...)` |
| Pure utilities | Direct calls, `it.each` tables |

## Rules

1. Query by role, label, and text. Prefer accessible queries over test ids.
2. Use `userEvent.setup()` and `await user.click(...)` for interactions when the package is available.
3. Await async UI with `findBy...` or `await waitFor(...)`; do not sleep.
4. Cast mocks at the boundary with `as unknown as T`, never `as any`.
5. Reset mocks in `beforeEach(() => vi.clearAllMocks())` when module mocks are shared across tests.
6. Restore globals: `vi.unstubAllGlobals()`, `vi.useRealTimers()` in `afterEach`.
7. Do not edit production files, `src/test/*`, `vite.config.ts`, or `package.json`. Helpers go inside the test file.
8. Tests never write to the repository (files, fixtures, snapshots on disk) and never use unstubbed `Math.random()` or `randomUUID()`; the host rejects both.

## Checklist before finishing

- The test file compiles under `tsc`.
- Each test asserts visible output, callback calls, or cache state, not internal component state.
- The file passes `npm test -- src/<path>.test.tsx`.
