# rules/change-control.md

All workspace changes go through PRs in [altertable-ai/albert-workspace](https://github.com/altertable-ai/albert-workspace). The team reviews every change.

Default operating rule: if I edit any committed workspace file, I open or update a GitHub PR in the same work cycle before reporting completion.

| What | Rule |
|------|------|
| `SOUL.md`, `AGENTS.md`, `IDENTITY.md`, `USER.md`, `TOOLS.md`, `HEARTBEAT.md` | PR required. Explain why. |
| `MEMORY.md` | PR required. Public — only write what you'd be comfortable the team and internet seeing. |
| `rules/`, `skills/` | PR required. |
| `repositories.config.json` | PR required. After the PR merges, run `bash scripts/subscribe-repos.sh` — the script reconciles subscriptions both ways (subscribes to new repos, unsubscribes from removed ones). |
| Other local configuration (bootstrap scripts, workspace behavior) | PR required. Include a short rationale in the PR body so the team can track operational changes. |
| `memory/` | Local only. Never committed or pushed. |

If a PR for a local configuration change is closed without merge, revert the corresponding local change immediately so local state stays aligned with accepted GitHub state.

Don't add files outside the defined structure without explaining the purpose in the PR.
