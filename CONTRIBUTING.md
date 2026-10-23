# Contributing

This guide is for people and coding agents changing Albert’s workspace.
Treat his runtime instructions as configuration under review. Keep your own
identity and credentials; do not run Albert’s heartbeat or maintenance jobs.

## Where to find things

| Change | Location |
|--------|----------|
| Session roles and task routing | [AGENTS.md](AGENTS.md) |
| Albert’s identity, tone, and avatar | [IDENTITY.md](IDENTITY.md), [SOUL.md](SOUL.md), [assets/](assets/) |
| Repositories and team context | [repositories.config.json](repositories.config.json), [USER.md](USER.md) |
| Shared behavior and permissions | [rules/](rules/) |
| Guidance for a specific task | [skills/](skills/) |
| Files copied into maintained repositories | [skills/sdk-sync/templates/](skills/sdk-sync/templates/) |
| Maintenance tools and their tests | [scripts/](scripts/), [scripts/tests/](scripts/tests/) |
| OpenClaw config and version pin | [openclaw/](openclaw/) |
| Scheduled jobs | [scripts/openclaw-jobs.ts](scripts/openclaw-jobs.ts) |
| Saved work state example | [schemas/heartbeat-state.example.json](schemas/heartbeat-state.example.json) |
| Verification commands and CI | [Makefile](Makefile), [.github/workflows/](.github/workflows/) |

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
