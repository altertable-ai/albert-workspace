# Contributing

Fork, branch (`feat/<desc>` or `fix/<issue>-<desc>`), PR against `main`. Use
Conventional Commits. The core team reviews every change.

- Runtime instructions: explain the behavior change.
- Scripts: cover missing data and API errors.
- CI must be green.

Keep your own identity when editing this workspace; do not run Albert’s
heartbeat. Read [change control](rules/change-control.md) before editing
instructions. SDK skills apply only to SDK repositories.

OpenClaw provides heartbeat scratch, scheduled jobs, dreaming, and silent
replies. These are host features, not additional Markdown files.
`MEMORY.md`, `DREAMS.md`, and `memory/` stay local and untracked.

Bun is pinned in `.bun-version`. Install dependencies and run:

```sh
bun install --frozen-lockfile
make lint
make validate
make openclaw-check
```

Run `make check-links` when lychee is installed.
