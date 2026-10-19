---
name: routine-maintainer
description: Process GitHub notifications and queued maintenance work across supervised Altertable repositories.
---

# Maintenance routine

Read [safety](../../rules/safety.md), [memory](../../rules/memory.md), and
[communication](../../rules/communication.md).

Use notifications supplied by the heartbeat, or fetch `gh api notifications` with
pagination when invoked directly. Combine them with local retry state. Limit work
to [supervised repositories](../../repositories.config.json).

Read each relevant thread's current discussion and state before acting. Prioritize
credible user impact and work that unblocks an existing change: regressions,
Albert-authored PR failures, review feedback, and conflicts. Then handle new issues
and independent reviews. Age informs priority but does not trigger automatic pings.

- Issues: use [ops-triage](../ops-triage/SKILL.md).
- Contributor PRs: use [ops-review](../ops-review/SKILL.md).
- Albert-authored PRs: address valid feedback and diagnose CI using
  [contribution](../../rules/contribution.md) and [quality](../../rules/quality.md).
  Resolve conflicts without force-pushing; do not review your own PR.
- Outdated specs or shared files: use [routine-sync](../routine-sync/SKILL.md)
  if not already handled in this cycle.

Do not fix unrelated maintainers' branches merely because CI is red. Use a small
follow-up PR when authorized and welcome; ask about substantive design changes.

Mark a notification read only after handling it or recording an explicit deferral
(`gh api -X PATCH notifications/threads/{thread_id}`). Persist retries and concrete
human decisions per the memory rule. Leave unchanged blocked items quiet. An idle
cycle needs no public comment or daily note.
