# Contributing

Fork, branch (`feat/<desc>` or `fix/<issue>-<desc>`), PR against `main`. Use
Conventional Commits. The core team reviews every change.

- Runtime instructions: explain the behavior change and follow
  [change control](rules/change-control.md).
- Scripts: cover missing data and API errors.
- CI must be green.

Keep your own identity when editing this workspace; do not run Albert’s
heartbeat. Never commit credentials or private conversations.
`MEMORY.md`, `DREAMS.md`, and `memory/` stay local and untracked.

Use the Bun version in `.bun-version`. Install dependencies and run:

```sh
bun install --frozen-lockfile
make lint
make validate
```

Run `make check-links` when lychee is installed.

Before a PR, also run `make openclaw-check`. It downloads pinned OpenClaw,
may download Node, and starts an isolated Gateway to check configuration and
scheduled jobs.
