# UTA

**Unit Test Agent** for Vitest monorepos: a deterministic host pipeline plans which changed files need tests, hands each target to a replaceable author (Claude Agent SDK, another agent, or a human), and accepts the result only after hard gates pass.

This is not a generic test framework and not a free-form coding agent. The model only writes the test file; the host owns scope, budgets, verification, and publishing.

## How it works

```
preflight -> diff -> baseline (suites, coverage, tsc) -> plan
  -> per target: author -> gates G0..G7 -> repair (max 2) -> accepted | rejected
  -> final suites -> report, test-only patch -> publish to the PR
```

| Piece | Location |
|-------|----------|
| Harness (CLI, pipeline, gates, publisher) | [`agent/`](agent/), see [`agent/README.md`](agent/README.md) |
| Custom agents and skills | [`.claude/`](.claude/) |
| Design notes | [`docs/DESIGN.md`](docs/DESIGN.md) |
| Edge cases | [`docs/edge-cases.md`](docs/edge-cases.md) |
| Sample target app | `backend/`, `frontend/` |
| PR workflow example | [`.github/workflows/unit-test-agent.yml`](.github/workflows/unit-test-agent.yml) |

### Authors

| Driver | Role |
|--------|------|
| `sdk` | Claude Agent SDK (default in CI) |
| `external` | Same packets and gates; you (or another agent) write the test via the CLI |
| `stub` | Recorded output for harness tests |

### Gates (summary)

G0 no-progress, G1 scope (only the target test file), G2 static checks, G3 typecheck, G4 pass, G5 stability (shuffled repeats), G6 coverage of target lines, G7 full suite still green. Side effects on production files are reverted and fail the target.

## Layout assumption (v1)

UTA expects a monorepo with:

- `backend/` and `frontend/` packages using Vitest and TypeScript
- Writable tests only under `backend/tests/**/*.test.ts` and `frontend/src/**/*.test.ts(x)`

Configurable package roots are out of scope for v1. The included `backend/` and `frontend/` trees are a small original demo so harness e2e and dogfood work out of the box.

## Requirements

- Node.js >= 22.12
- Git
- Docker (optional locally; used for the sandbox in CI)

## Quick start

```sh
cp .env.example .env
npm ci --prefix backend
npm ci --prefix frontend
npm ci --prefix agent
```

Run the sample package tests:

```sh
npm test --prefix backend
npm test --prefix frontend
```

Drive the harness locally without a model key (external author):

```sh
node agent/src/cli.mjs run --mode pr --base origin/main --author external
```

Harness self-tests (unit + e2e against the sample monorepo):

```sh
npm test --prefix agent
```

## GitHub Actions

1. Secret `ANTHROPIC_API_KEY` (without it the author job skips generation; publish still posts a sticky PR comment).
2. Optional secret `UNIT_TEST_AGENT_PUSH_TOKEN` (fine-grained Contents + Pull requests write) so the agent's commit triggers CI.
3. Settings → Actions → General: allow GitHub Actions to create pull requests (bootstrap mode).
4. Optional variables: `TEST_AGENT_MODE` (`commit` or `comment`), `TEST_AGENT_MODEL`.

The example workflow runs on PRs that change `frontend/src/**` or `backend/src/**`, and on manual bootstrap dispatch.

## License

MIT. See [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).
