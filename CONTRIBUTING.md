# Contributing to albert-workspace

Changes here affect how Albert behaves across all repositories in `repositories.config.json`.

## How to contribute

1. Fork → branch (`feat/<desc>` or `fix/<issue>-<desc>`) → PR against `main`
2. All changes are reviewed by the core team before merging

## Before opening a PR

- **Runtime instructions and skills**: Explain the behavior change and verify the
  intended replies and actions without external writes.
- **Entrypoints**: `AGENTS.md` directs Albert's OpenClaw sessions to `ALBERT.md`
  and separately guides repository editors. Verify both paths: Albert loads his
  runtime instructions; repository editors keep their own identity and do not run
  his startup or heartbeat routines.
- **Scripts**: Verify they handle missing data, API errors, and edge cases without crashing silently.
- **CI workflows**: Require a passing run before review.

## Local checks

The CI runs a markdown linter and a link checker. Run them locally before pushing:

**Prerequisites**:

- Node.js (for `npx`)
- Bun (pinned in `.bun-version`; for workspace scripts and `bun test`)
- [Lychee](https://github.com/lycheeverse/lychee):
  - macOS: `brew install lychee`
  - Linux: `cargo install lychee` (or `snap install lychee` on Ubuntu/Debian)

**Commands**:

- `make lint` — lint all Markdown files
- `make validate` — check workspace requirements, workflow policy, and script tests
- `make check-links` — check for broken links
- `make ci` — run all checks

## What not to add

- Files outside the defined workspace structure
- Secrets or credentials
- `memory/` files — local-only, never committed

## Links

- [altertable-client-specs](https://github.com/altertable-ai/altertable-client-specs) — SDK specifications
- [altertable-ai org](https://github.com/altertable-ai) — Altertable repositories
