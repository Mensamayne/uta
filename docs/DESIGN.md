# Design: unit-test agent (UTA)

A custom agent that writes and updates Vitest unit tests for a `backend/` + `frontend/` monorepo, verifies them by running them, and reports on GitHub pull requests.

| Piece | Location |
|-------|----------|
| Custom agents | `.claude/agents/unit-test-author.md`, `.claude/agents/test-reviewer.md` |
| Reusable skills | `.claude/skills/` |
| Harness (pipeline, gates, CLI, publisher) | `agent/`, see [`agent/README.md`](../agent/README.md) |
| PR workflow | `.github/workflows/unit-test-agent.yml` |
| Edge cases and comparison with other agents | [`edge-cases.md`](edge-cases.md) |

## Main technical decisions

**A fixed pipeline with one agentic step.** A deterministic Node pipeline does everything that can be computed; the model only writes the test. A pipeline can guarantee scope, budgets, and verification; a free agent loop can only be asked to.

```
preflight -> diff -> baseline (suites, coverage, tsc) -> plan
  -> per target: author -> gates G0..G7 -> repair (max 2) -> accepted | rejected
  -> final suites -> report, test-only patch -> publish to the PR
```

**"When appropriate" is decided from data.** Per changed file, from the diff and the baseline coverage of the project's own Vitest config (`--coverage.all` so new modules that no test imports yet still appear): `noop` (outside the coverage scope, or changed lines already covered), `repair-existing` (the PR broke its tests), `write` (no test file, or a new file), `update` (uncovered changed lines). Failing tests whose source was not in the diff still get a collateral `repair-existing` target, so the final suite can go green.

**Nothing the author claims is trusted.** The host runs acceptance gates on every result: no resubmitted failure (G0), only the target's test file changed (G1), static checks such as no `.only`/`.skip`, assertions in every test, no removed tests, no new dependencies, no unstubbed randomness (G2), no new `tsc` errors (G3), passes (G4), covers target lines (G6), passes three times in shuffled order (G5), full suite still green (G7). After every test run the worktree is checked again; side effects are reverted and fail the target. This is the TestGen-LLM / CoverUp filter: builds, passes, passes repeatedly, adds coverage. A failing assertion the author attributes to a source bug is dropped and reported as a suspected defect, never "repaired" into passing.

**Replaceable author.** `sdk` (Claude Agent SDK, default in CI), `external` (the CLI hands the same task packet to a person or another agent; refused in CI), `stub` (recorded output for tests). Same prompt, tools, budgets, and gates for all three.

**Least privilege.** The `author` job has the model key and a read-only token; every Vitest and `tsc` run happens in a Docker container without network or secrets; the harness and `.claude/` come from the base branch, so a PR cannot change the agent that reviews it. The `publish` job has a write token, never runs repository code, re-validates the test-only patch, checks the PR head did not move, commits, and keeps one updated PR comment.

**Small stack.** Plain Node ESM, no LangChain or LangGraph; two runtime dependencies (Agent SDK, zod); harness tests include end-to-end runs on real Vitest and `tsc`, the real Agent SDK against a scripted Messages API, and the Docker sandbox in CI.

## Running the PR workflow

Prerequisites:

1. Repository secret `ANTHROPIC_API_KEY` (without it the author job skips generation; the publish job still posts a sticky PR comment explaining the skip).
2. Optional secret `UNIT_TEST_AGENT_PUSH_TOKEN`: a fine-grained token for this repository with Contents and Pull requests set to "Read and write". The publish job checks it with a dry-run push and falls back to `GITHUB_TOKEN` with a warning if it cannot write, so a wrong token never loses the tests. The agent's commit is pushed with it so CI runs on that commit (runs started by a `GITHUB_TOKEN` push do not execute: GitHub either skips them or holds them as "action required"). The agent's own commit is recognized by its message and does not start another agent run.
3. Settings, Actions, General: allow GitHub Actions to create pull requests (bootstrap mode).
4. Optional variables: `TEST_AGENT_MODE` (`commit` default, or `comment`), `TEST_AGENT_MODEL`.
5. GitHub-hosted `ubuntu-latest` runners (Docker preinstalled).

It runs automatically on pull requests that change `frontend/src/**` or `backend/src/**` (drafts and forks skipped), and manually ("Run workflow") in bootstrap mode, which covers files below 80% and opens a PR. Locally, see the CLI in [`agent/README.md`](../agent/README.md); `--author external` needs no key.

## Custom agent and skills

`unit-test-author` writes tests for one source file per session. Tools: `Read`, `Grep`, `Glob`, `Write`, `Edit`, `Skill`, and three task-scoped MCP tools served by the harness (`get_change_context`, `run_tests`, `coverage_for_file`); no shell, no web. A `PreToolUse` hook denies writes outside the target's test file. The final answer is a schema-checked JSON report (structured output). The harness reads the agent file and applies its prompt and tools to the SDK session, which runs with an isolated home directory. `test-reviewer` is read-only, runs after acceptance, and adds advisory notes about the tests added or changed in the run only (pre-existing tests in the same file are out of scope).

| Skill | Used for |
|-------|----------|
| `diff-test-planning` | Case list from changed lines; expected values from intent, not from replaying the implementation |
| `backend-unit-tests` | Flat Vitest tests under `backend/tests/`, zod/validators, fakes at module boundaries |
| `frontend-unit-tests` | Colocated React Testing Library tests, hooks, `fetch` stubs, fake timers |
| `test-failure-triage` | Failure classes, test bug vs code bug, forbidden fixes |
| `test-quality-review` | The reviewer's checklist |

The task packet names the skills for each target; the same `SKILL.md` files work in CI and in a developer's Claude Code.

## Assumptions

- PR authors are collaborators; fork PRs get no secrets and are skipped.
- Unit tests need no database or network, and Vitest stays the only test framework.
- The base branch holds the trusted harness and agent configuration.
- Accepted tests still go through normal human review of the PR.

## Limitations

- The Docker sandbox runs on Linux only; local runs on Windows or macOS use the host.
- Without a working `UNIT_TEST_AGENT_PUSH_TOKEN` (unset, or failing the dry-run push check), the agent's commit is pushed with `GITHUB_TOKEN` and CI does not run on it without a manual approval; the publisher always sets the `unit-test-agent/verified` commit status from the verified run.
- Coverage is a proxy: changed lines that existing tests execute are a `noop` even if the new behavior is not asserted. Gains are measured on lines, not branches.
- Static checks are regular expressions; a correctly named but wrong defect claim reaches the report (labeled unverified).
- USD limits are checked between model turns, so a session can exceed its allowance by one turn.
- Results are all or nothing per target; the PR comment shows the latest run only; targets per run are capped (8).
- The check that stops a run on the agent's own commit reads the commit message through the GitHub API; if that call fails, the run proceeds. It finds nothing new to test and commits nothing, so this costs one empty run, not a loop.

## What would change for production hardening

- A GitHub App identity instead of a personal token, so the agent's commits have their own author and branch protection can tell them apart.
- Mutation testing (for example Stryker) as an extra value gate; branch-aware coverage gains.
- Run history across pushes in the PR comment; parallel targets; baseline cache per base commit.
- An evaluation set of past PRs to measure changes to prompts, skills, or models; cost dashboards from `run.json`.
- Configurable package roots beyond the fixed `backend/` + `frontend/` layout.
