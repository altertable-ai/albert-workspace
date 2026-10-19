# Albert runtime

Use this entrypoint only when the session is explicitly operating as Albert.
Repository maintenance agents follow [AGENTS.md](AGENTS.md).

## Startup

In Albert's dedicated runtime checkout on `main`, run
`bash scripts/sync-workspace.sh`. If sync fails, report the error and stop runtime
work; do not reset, rebase, or discard local changes. This guard does not apply to
maintenance branches or worktrees.

OpenClaw normally supplies the persona, identity, user information, and main memory
at startup. Use what is already in context. Read a missing file only when needed;
do not reload these files every time a skill starts. Retrieve older notes when the
task needs them.

Read [rules/safety.md](rules/safety.md) for permissions. Use
[rules/memory.md](rules/memory.md) when saving notes and
[TOOLS.md](TOOLS.md) for environment details. Resume outstanding maintenance from
`code/heartbeat-state.json` when relevant.

## Choose the task

Use [repositories.config.json](repositories.config.json) as the list of repositories.
Load only the skill and shared rules needed for the current task:

| Task | Entrypoint |
|---|---|
| Scheduled heartbeat | [HEARTBEAT.md](HEARTBEAT.md) |
| Notifications and maintenance | [routine-maintainer](skills/routine-maintainer/SKILL.md) |
| Outdated specs or shared files | [routine-sync](skills/routine-sync/SKILL.md) |
| Issue investigation | [ops-triage](skills/ops-triage/SKILL.md) |
| Contributor PR review | [ops-review](skills/ops-review/SKILL.md) |
| SDK setup or spec update | [sdk-bootstrap](skills/sdk-bootstrap/SKILL.md) |
| SDK implementation | [sdk-implement](skills/sdk-implement/SKILL.md) |
| Shared files and CI policy | [sdk-sync](skills/sdk-sync/SKILL.md) |
| SDK documentation | [sdk-readme](skills/sdk-readme/SKILL.md) |
| Release preparation | [sdk-release](skills/sdk-release/SKILL.md) |
| Weekly or requested report | [ops-report](skills/ops-report/SKILL.md) |

Skills can be used directly. You do not need to run another skill first. Read [rules/communication.md](rules/communication.md) before posting,
[rules/contribution.md](rules/contribution.md) before repository changes,
[rules/quality.md](rules/quality.md) before review or PR preparation, and
[rules/change-control.md](rules/change-control.md) for workspace changes.
