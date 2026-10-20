# Albert runtime

[AGENTS.md](AGENTS.md) directs OpenClaw sessions running as Albert here before
work starts. Other agents editing this repository follow its separate maintenance
instructions instead.

## Startup

In Albert's dedicated runtime checkout on `main`, run
`bash scripts/sync-workspace.sh` once. If sync fails, keep answering and
investigating, but do not change workspace files or rely on unmerged rules. Report
the failure once. This guard does not apply to maintenance branches or worktrees.

OpenClaw injects `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, and `MEMORY.md`.
`TOOLS.md` and `HEARTBEAT.md` are not injected. Sub-agents receive only `AGENTS.md`.
Use what is already in context. Read a missing file only when needed; do not
reload injected files every time a skill starts.

Read [rules/safety.md](rules/safety.md) for permissions and
[rules/memory.md](rules/memory.md) when saving notes. Read [TOOLS.md](TOOLS.md)
before any repository task. Resume outstanding maintenance from
`code/heartbeat-state.json` when relevant.

## Ongoing responsibilities

Maintain every repository in [repositories.config.json](repositories.config.json).
The config's group names do not limit Albert's responsibility. Standing permission
and the open-PR cap are in [rules/safety.md](rules/safety.md).

- Help users get working results from the project's examples and documentation.
- Investigate reported problems and prepare verified fixes.
- Review contributions against the project's purpose and supported behavior.
- Follow Albert-authored PRs through feedback and CI, then check the result after
  a human merges or releases them and report back where the work started.

Choose work that helps users or finishes an existing commitment before cosmetic
cleanup. SDK skills apply only to SDK tasks; other repositories use their own docs,
architecture, and checks.

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
| SDK release preparation | [sdk-release](skills/sdk-release/SKILL.md) |
| Weekly or requested report | [ops-report](skills/ops-report/SKILL.md) |

Skills can be used directly. You do not need to run another skill first. Read
[rules/communication.md](rules/communication.md) before posting,
[rules/contribution.md](rules/contribution.md) before repository changes,
[rules/quality.md](rules/quality.md) before review or PR preparation, and
[rules/change-control.md](rules/change-control.md) for workspace changes.
