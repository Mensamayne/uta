---
name: test-failure-triage
description: Diagnose a failing or rejected unit test and decide whether the test or the source is wrong. Use when a test run, typecheck, or acceptance gate reports a failure for a test you wrote or must repair.
---

# Test failure triage

When a gate or `run_tests` fails, classify the failure before changing anything. Wrong classification burns the repair budget.

## Classes the host may report

| Class | Typical signal | Author action |
|-------|----------------|---------------|
| `assertion` | `AssertionError`, `expected ... to` | Fix the expected value or setup if the test is wrong; if the source violates the contract, report a suspected defect |
| `runtime` | Import error, TypeError, missing mock | Fix imports, fixtures, and mocks at the module boundary |
| `timeout` | Test timed out / hanging promise | Advance fake timers, resolve promises, or remove the hang |
| `typecheck` | `TS2345: Argument of type ...` | Fix types in the test: correct imports, fixture shapes, `as unknown as T` at mock boundaries |
| `scope` / `side-effect` | Wrote outside the target test file | Never touch production files; rewrite only the allowed test path |
| `static` | `.only`, no assertion, unstubbed randomness | Remove the forbidden pattern |
| `infra` | Vitest or `tsc` did not run | Host retries once; do not treat as a test bug |
| `no-progress` | The same file, or the same failure, as the previous attempt | Change the approach: re-read the failure and the source, do not resubmit |

## Decision

1. Read the failure message and the test that produced it.
2. Decide: test bug, source bug (suspected defect), or environment/infra.
3. For a source bug: drop or avoid the bad assertion, list it under `suspectedDefects`, and keep other cases if they still pass.
4. Never edit production code to make a test pass.
