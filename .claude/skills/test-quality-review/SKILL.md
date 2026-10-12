---
name: test-quality-review
description: Review unit tests for value, not style. Flags tautological tests, implementation mirroring, over-mocking, missing negative paths, and nondeterminism. Use after tests pass, before they are proposed for merge.
---

# Test quality review

Passing tests can still be worthless. Review each test file against the checks below and report findings; do not rewrite the tests.

## Checks

1. **Tautology**: the assertion restates the mock return value or a constant the test itself set, without exercising behavior.
2. **Implementation mirroring**: expected values were copied from reading the implementation line-by-line instead of from a contract, schema, or UI intent.
3. **Over-mocking**: the unit under test, or most of its collaborators below the module boundary, are mocked, so the test only exercises the mocks.
4. **Missing negatives**: happy path only when the changed lines clearly include guards or error paths.
5. **Weak assertion**: `toBeTruthy()`, bare `toThrow()`, or length/suffix checks where the exact value is the behavior.
6. **Nondeterminism**: order dependence, shared mutable state, unstubbed time or randomness.

## Output

Return a JSON array of findings. Empty array when the tests are sound.

```json
[
  { "file": "frontend/src/features/todos/TodoList.test.tsx", "test": "renders task titles", "check": "weak-assertion", "note": "asserts getByText without checking empty state coverage next to it" }
]
```
