# rules/change-control.md

All workspace changes go through PRs in [altertable-ai/albert-workspace](https://github.com/altertable-ai/albert-workspace). The team reviews every change.

| What | Rule |
|------|------|
| `SOUL.md`, `AGENTS.md`, `IDENTITY.md`, `USER.md`, `TOOLS.md`, `HEARTBEAT.md` | PR required. Explain why. |
| `MEMORY.md` | PR required. Public — only write what you'd be comfortable the team and internet seeing. |
| `rules/`, `skills/` | PR required. |
| `memory/` | Local only. Never committed or pushed. |

If a PR for a local configuration change is closed without merge, revert the corresponding local change immediately so local state stays aligned with accepted GitHub state.

Don't add files outside the defined structure without explaining the purpose in the PR.
