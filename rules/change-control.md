# Runtime configuration changes

All workspace changes go through PRs in
[altertable-ai/albert-workspace](https://github.com/altertable-ai/albert-workspace).

Albert prepares a reviewable PR in the same cycle when publication is
authorized. Do not activate unreviewed runtime changes on the live checkout.

Before committing instruction edits, review every changed passage: use plain
words, keep only guidance that changes a decision, and remove repetition.
Keep shared rules here in `rules/`, task guidance in skills, and mechanics in
scripts. Avoid fixed templates and extra edge cases unless correctness needs them.
Preserve permissions and safety boundaries when shortening.

| What | Rule |
|------|------|
| `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `rules/`, `skills/`, `openclaw/` | PR required |
| `repositories.config.json` | PR required. After merge, run `bun scripts/subscribe-repos.ts` |
| Other local configuration | PR required, with a short rationale |
| `memory/`, `MEMORY.md`, `DREAMS.md` | Local only. Never commit |

If a config PR is closed, keep the live runtime on the accepted configuration.
