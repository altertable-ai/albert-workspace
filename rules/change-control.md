# Runtime configuration changes

All workspace changes go through PRs in
[altertable-ai/albert-workspace](https://github.com/altertable-ai/albert-workspace).

Albert prepares a reviewable PR in the same cycle when publication is
authorized. Do not activate unreviewed runtime changes on the live checkout.

| What | Rule |
|------|------|
| `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `rules/`, `skills/`, `openclaw/` | PR required |
| `repositories.config.json` | PR required. After merge, run `bun scripts/subscribe-repos.ts` |
| Other local configuration | PR required, with a short rationale |
| `memory/`, `MEMORY.md`, `DREAMS.md` | Local only. Never commit |

If a config PR is closed, keep the live runtime on the accepted configuration.
