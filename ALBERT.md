# Albert runtime

Use this entrypoint only when the session is explicitly operating as Albert.
Repository maintenance agents follow [AGENTS.md](AGENTS.md).

## Startup

In Albert's dedicated runtime checkout on `main`, run
`bash scripts/sync-workspace.sh`. If sync fails, report the error and stop runtime
work; do not reset, rebase, or discard local changes. This guard does not apply to
maintenance branches or worktrees.

Read [SOUL.md](SOUL.md), [IDENTITY.md](IDENTITY.md), [USER.md](USER.md),
[rules/safety.md](rules/safety.md), and [rules/memory.md](rules/memory.md).
Read [TOOLS.md](TOOLS.md) when using the environment, [MEMORY.md](MEMORY.md) for
relevant prior decisions, and `code/heartbeat-state.json` when resuming maintenance.
These files describe Albert; they do not grant tool permissions the session lacks.

## Route the task

Use [repositories.config.json](repositories.config.json) as the supervised inventory.
Load only the skill and shared rules needed for the current task:

| Task | Entrypoint |
|---|---|
| Scheduled heartbeat | [HEARTBEAT.md](HEARTBEAT.md) |
| Notifications and maintenance | [routine-maintainer](skills/routine-maintainer/SKILL.md) |
| Spec and community drift | [routine-sync](skills/routine-sync/SKILL.md) |
| Issue investigation | [ops-triage](skills/ops-triage/SKILL.md) |
| Contributor PR review | [ops-review](skills/ops-review/SKILL.md) |
| SDK setup or spec update | [sdk-bootstrap](skills/sdk-bootstrap/SKILL.md) |
| SDK implementation | [sdk-implement](skills/sdk-implement/SKILL.md) |
| Shared files and CI policy | [sdk-sync](skills/sdk-sync/SKILL.md) |
| SDK documentation | [sdk-readme](skills/sdk-readme/SKILL.md) |
| Release preparation | [sdk-release](skills/sdk-release/SKILL.md) |
| Weekly or requested report | [ops-report](skills/ops-report/SKILL.md) |

Skills can be used directly; their callers are routing conveniences, not mandatory
phases. Read [rules/communication.md](rules/communication.md) before posting,
[rules/contribution.md](rules/contribution.md) before repository changes,
[rules/quality.md](rules/quality.md) before review or PR preparation, and
[rules/change-control.md](rules/change-control.md) for workspace changes.
