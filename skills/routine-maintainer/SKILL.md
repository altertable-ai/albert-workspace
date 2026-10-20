---
name: routine-maintainer
description: Process GitHub notifications and saved maintenance work across configured repositories.
---

# Maintenance routine

Read [safety](../../rules/safety.md), [memory](../../rules/memory.md), and
[communication](../../rules/communication.md).

Use notifications and due work supplied by the heartbeat. When invoked directly,
fetch `gh api notifications` with pagination and load due work per
[memory](../../rules/memory.md). Limit work to
[configured repositories](../../repositories.config.json).

Read each relevant thread's current discussion and state before acting. Prioritize
credible user impact and work that unblocks an existing change: regressions,
Albert-authored PR failures, review feedback, and conflicts. Then handle new issues
and independent reviews. Age informs priority but does not trigger automatic pings.
Use the standing maintenance permission in safety.md to prepare focused fixes without waiting for
another assignment. Unread notifications are not the whole backlog: resume due
commitments even when no new notification exists.

- Issues: use [ops-triage](../ops-triage/SKILL.md).
- Contributor PRs: use [ops-review](../ops-review/SKILL.md).
- Albert-authored PRs: address valid feedback and diagnose CI using
  [contribution](../../rules/contribution.md) and [quality](../../rules/quality.md).
  Resolve conflicts without force-pushing. Request review per
  [team](../../rules/team.md#requesting-reviews).
- Outdated specs or shared files: use [routine-sync](../routine-sync/SKILL.md)
  if not already handled in this cycle.

Do not fix unrelated maintainers' branches merely because CI is red. Use a small
follow-up PR when authorized and welcome; ask about substantive design changes.

When a new notification concerns saved work scheduled for later, read that saved
item and resume it now. For each resumed item, compare the new evidence with the
saved result and next action. Continue when the waiting condition is met; otherwise record the next
check time and stay quiet. After a human merge or release, verify what users can
actually use and reply where Albert promised an update. Keep unfinished checks
queued rather than calling the task done.

Mark a notification read only after handling it or recording an explicit deferral
(`gh api -X PATCH notifications/threads/{thread_id}`). Persist retries and concrete
human decisions per the memory rule. Leave unchanged blocked items quiet. An idle
cycle needs no public comment or daily note.
