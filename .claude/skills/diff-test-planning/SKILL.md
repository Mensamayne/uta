---
name: diff-test-planning
description: Plan unit test cases for one changed or under-covered source file in the target monorepo. Use before writing or extending any Vitest test, when you know the source file and the lines that need coverage.
---

# Diff test planning

Turn "this file changed and these lines are not covered" into a short, ordered list of test cases worth writing. Planning comes before code: a test file written without a plan tends to mirror the implementation.

## Inputs

- The source file and the lines to cover (from the task packet or `uta tool change-context`).
- The existing test file for that source, if any, and one neighboring test as a style reference.

## Steps

1. Read the whole source file, not only the changed lines. Note its public surface: exported functions, components, routes, hooks.
2. Read the existing test file. List what it already covers so you do not duplicate it.
3. For each line range to cover, name the behavior it implements in one sentence ("PATCH returns 404 when the task does not exist"). Lines are a pointer to behavior, not the goal.
4. Order cases with [references/case-order.md](references/case-order.md) and drop cases that add nothing over an existing test.
5. Decide the seam for each case: what is real, what is mocked, and where the mock sits (module boundary only).
6. Write the cases as `it(...)` titles first, as complete sentences, then implement them.

## The oracle rule

Expected values come from the intent of the code: names, types, validation schemas, API contracts, UI copy, and the change itself. Do not compute expected values by re-running the implementation in your head and copying what it produces. If the intent and the implementation disagree, the test should assert the intent and fail; report it as a suspected defect instead of adjusting the assertion.

Useful sources of intent in this monorepo layout:

- Backend validation: zod schemas under `backend/src/**` (for example `backend/src/features/todos/validators.ts`).
- Frontend copy and labels: the strings rendered by the component under test.
- Shared field limits documented next to the schemas under test.

## What not to test

- Re-exports (`index.ts`), types, styles, constants, Storybook stories.
- Framework behavior (that Express parses JSON, that React renders a prop).
- Private helpers through anything other than the public unit that uses them.
- Exact log text or call order unless the behavior depends on it.

## Output of planning

A list like:

```
backend/src/features/todos/validators.ts, lines 3-8 (titleSchema)
1. accepts a trimmed title at the max length          (happy path)
2. rejects an empty title                             (guard)
3. rejects a title longer than the documented max     (boundary)
```

Keep it to the cases that cover the target lines and the obvious negative paths next to them. More tests are not better tests.
