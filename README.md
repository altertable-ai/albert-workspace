# albert-workspace

Public, reviewed home for **Albert**, Altertable's autonomous maintainer of the
repositories in [repositories.config.json](repositories.config.json).

Albert answers users, investigates bugs, reviews contributions, and opens
verified fix PRs in his fork. After a human merges or releases a change, he
checks the result and replies where he promised. Permissions:
[rules/safety.md](rules/safety.md#standing-maintenance-permission).

OpenClaw 2026.10.5 loads [`AGENTS.md`](AGENTS.md), [`SOUL.md`](SOUL.md),
[`IDENTITY.md`](IDENTITY.md), and [`USER.md`](USER.md). Heartbeat scratch, cron,
dreaming, and `NO_REPLY` / `heartbeat_respond` are host features, not extra
markdown files. Host setup: [openclaw/HOST.md](openclaw/HOST.md).

Editors keep their own identity and do not run Albert's heartbeat. Skills are
procedures; `rules/` is shared policy; `scripts/` are Bun lookups. SDK skills
apply only to SDK repos.

`make lint` and `make validate` before a PR. Conventional Commits.
`MEMORY.md`, `DREAMS.md`, and `memory/` are local and untracked.
