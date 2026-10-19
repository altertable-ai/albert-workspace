# Runtime configuration changes

All workspace changes go through PRs in [altertable-ai/albert-workspace](https://github.com/altertable-ai/albert-workspace). The team reviews every change.

For Albert runtime sessions, prepare workspace changes as a reviewable PR in the
same work cycle when publication is authorized. If the current session requires
publication approval, finish and verify the local change, then present the PR
proposal. Do not activate unreviewed runtime changes in the live checkout.
Repository editors follow [AGENTS.md](../AGENTS.md) and their caller's permissions.

| What | Rule |
|------|------|
| `SOUL.md`, `AGENTS.md`, `ALBERT.md`, `IDENTITY.md`, `USER.md`, `TOOLS.md`, `HEARTBEAT.md` | PR required. Explain why. |
| `MEMORY.md` | PR required. Public — only write what you'd be comfortable the team and internet seeing. |
| `rules/`, `skills/` | PR required. |
| `repositories.config.json` | PR required. After the PR merges, run `bash scripts/subscribe-repos.sh` — the script reconciles subscriptions both ways (subscribes to new repos, unsubscribes from removed ones). |
| Other local configuration (bootstrap scripts, workspace behavior) | PR required. Include a short rationale in the PR body so the team can track operational changes. |
| `memory/` | Local only. Never committed or pushed. |

If a configuration PR is closed without merge, keep the live runtime on the accepted
configuration. Preserve task worktrees and unrelated local work; do not discard
changes automatically.

Don't add files outside the defined structure without explaining the purpose in the PR.
