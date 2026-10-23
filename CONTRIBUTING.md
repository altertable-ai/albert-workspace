# Contributing

This guide is for people and coding agents changing Albert’s workspace.
Treat his runtime instructions as configuration under review. Keep your own
identity and credentials; do not run Albert’s heartbeat or maintenance jobs.

## Making changes

Work in a branch or worktree and open a PR against `main`. Use Conventional
Commits. The core team reviews every change.

- Instructions: explain the behavior change and follow
  [change control](rules/change-control.md).
- Scripts: cover missing data and API errors.
- Keep credentials and private conversations out of git. `MEMORY.md`, `DREAMS.md`,
  and `memory/` stay local and untracked.

## Verification

Use the Bun version in `.bun-version`. Install dependencies and run:

```sh
bun install --frozen-lockfile
make lint
make validate
```

Run `make check-links` when lychee is installed.

Before a PR, also run `make openclaw-check`. It downloads pinned OpenClaw,
may download Node, and starts an isolated Gateway to check configuration and
scheduled jobs. This check does not run Albert’s live maintenance jobs.

CI must pass before merge.
