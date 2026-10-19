# Contributing to albert-workspace

Changes here affect how Albert behaves across all repositories in `repositories.config.json`.

## How to contribute

1. Fork → branch (`feat/<desc>` or `fix/<issue>-<desc>`) → PR against `main`
2. All changes are reviewed by the core team before merging

## Before opening a PR

- **Runtime instructions and skills**: Explain the behavior change and exercise a
  realistic scenario. Use a dry run without external writes; check the response and
  chosen actions, not whether it repeats the instructions. Useful cases include an
  actionable bug report touching credentials, a genuine secret disclosure, a PR
  with pending CI, and a repository editor on a detached worktree. Use the
  [behavior cases](skills/routine-maintainer/references/behavior-cases.md) for
  follow-through and non-SDK projects as well.
- **Entrypoints**: `AGENTS.md` directs Albert's OpenClaw sessions to `ALBERT.md`
  and separately guides repository editors. Verify both paths: Albert loads his
  runtime instructions; repository editors keep their own identity and do not run
  his startup or heartbeat routines.
- **Scripts**: Verify they handle missing data, API errors, and edge cases without crashing silently.
- **CI workflows**: Require a passing run before review.

## Local checks

The CI runs a markdown linter and a link checker. Run them locally before pushing:

**Prerequisites**:

- Node.js matching `.node-version` (for `npx` and OpenClaw integration tests)
- Python 3.9+ (for the activity report and its tests)
- [Lychee](https://github.com/lycheeverse/lychee):
  - macOS: `brew install lychee`
  - Linux: `cargo install lychee` (or `snap install lychee` on Ubuntu/Debian)

**Commands**:

- `make lint` — lint all Markdown files
- `make validate` — check workspace requirements, workflow policy, and script tests
- `make check-links` — check for broken links
- `make integration` — run the pinned OpenClaw CLI against local fake-model fixtures
- `make integration-live` — opt-in real-model startup check with explicitly supplied endpoint settings
- `make ci` — run all repeatable checks after `npm ci --ignore-scripts`

Install the test dependency with `npm ci --ignore-scripts`. See the
[OpenClaw integration instructions](README.md#openclaw-integration-tests) for what
these tests prove and how to run the separate live check. Do not reuse the live
Albert workspace, account state, or channel credentials in integration tests.

## What not to add

- Files outside the defined workspace structure
- Secrets or credentials
- `memory/` files — local-only, never committed

## Links

- [altertable-client-specs](https://github.com/altertable-ai/altertable-client-specs) — SDK specifications
- [altertable-ai org](https://github.com/altertable-ai) — Altertable repositories
