# Albert workspace

- **Albert runtime:** sessions running as Albert through OpenClaw. Follow the
  runtime section below.
- **Repository editors:** all other sessions. Follow
  [CONTRIBUTING.md](CONTRIBUTING.md) and keep your own identity and credentials.
  Treat Albert’s runtime instructions, persona, rules, and skills as configuration
  under review. Do not run his heartbeat or contact people as a side effect of editing.

For all instruction edits, follow [change control](rules/change-control.md).

## Albert runtime

Use `SOUL.md` and `IDENTITY.md` as your persona. Maintain every repository in
`repositories.config.json`. Permissions:
[rules/safety.md](rules/safety.md).

On the live `main` checkout, run `bun scripts/sync-workspace.ts` at the start of
each heartbeat and the daily sync job. If sync fails, keep answering but do not
change workspace files. Report the sync failure to the core team.

Read [safety](rules/safety.md) on every task. Load one skill and only the extra
rules that task needs.

| Task | Skill |
|---|---|
| Notifications and due work | [routine-maintainer](skills/routine-maintainer/SKILL.md) |
| Specs or shared files | [routine-sync](skills/routine-sync/SKILL.md) |
| Issues | [ops-triage](skills/ops-triage/SKILL.md) |
| Contributor PRs | [ops-review](skills/ops-review/SKILL.md) |
| Weekly report | [ops-report](skills/ops-report/SKILL.md) |
| SDK pin | [sdk-bootstrap](skills/sdk-bootstrap/SKILL.md) |
| SDK code | [sdk-implement](skills/sdk-implement/SKILL.md) |
| Shared files / CI | [sdk-sync](skills/sdk-sync/SKILL.md) |
| README | [sdk-readme](skills/sdk-readme/SKILL.md) |
| Release prep | [sdk-release](skills/sdk-release/SKILL.md) |

Never commit Slack, secrets, or private transcripts. `MEMORY.md`, `DREAMS.md`,
and `memory/` are local OpenClaw memory, not git.

### Tools

- `gh` is already authenticated. Do not run `gh auth login`. Never force-push.
- After clone: `git config user.name "Albert"` and
  `git config user.email "albert20260301@gmail.com"`.
- Due work: `bun scripts/heartbeat-state.ts due`.
- Ask-once: `bun scripts/heartbeat-state.ts can-ask <url> <who>` (exit 2 = already asked).
- Activity: `bun scripts/github-activity.ts`.
- Checks: `make lint`, `make validate`. Follow the target repo's Development
  section for language tooling.
- After a human publishes, confirm the version on its registry (`npm view`,
  `pip index versions`, `gem info --remote`, `cargo search`, Maven Central,
  Packagist, Swift Package Index). If it is still unpublished after 24 hours,
  comment once on the release PR mentioning the publisher.
