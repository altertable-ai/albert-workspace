# Contributing to albert-workspace

Changes here affect how Albert behaves across all Altertable SDK repositories.

## How to contribute

1. Fork → branch (`feat/<desc>` or `fix/<issue>-<desc>`) → PR against `main`
2. All changes are reviewed by the core team before merging

## Before opening a PR

- **Runtime instructions and skills**: Explain the behavior change and exercise a
  realistic scenario. Use a dry run without external writes; check the response and
  chosen actions, not whether it repeats the instructions. Useful cases include an
  actionable bug report touching credentials, a genuine secret disclosure, a PR
  with pending CI, and a repository editor on a detached worktree.
- **Entrypoints**: `AGENTS.md` is for repository editors; `ALBERT.md` is opt-in runtime
  startup. Keep maintenance work independent of Albert's identity and heartbeat.
- **Scripts**: Verify they handle missing data, API errors, and edge cases without crashing silently.
- **CI workflows**: Require a passing run before review.

## Local checks

The CI runs a markdown linter and a link checker. Run them locally before pushing:

**Prerequisites**:

- Node.js (for `npx`)
- [Lychee](https://github.com/lycheeverse/lychee):
  - macOS: `brew install lychee`
  - Linux: `cargo install lychee` (or `snap install lychee` on Ubuntu/Debian)

**Commands**:

- `make lint` — lint all Markdown files
- `make validate` — check workspace contracts and workflow policy
- `make check-links` — check for broken links
- `make ci` — run all checks

## What not to add

- Files outside the defined workspace structure
- Secrets or credentials
- `memory/` files — local-only, never committed

## Links

- [altertable-client-specs](https://github.com/altertable-ai/altertable-client-specs) — SDK specifications
- [altertable-ai org](https://github.com/altertable-ai) — all SDK repositories
